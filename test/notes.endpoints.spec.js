/* eslint-disable semi */
const { expect } = require('chai')
const knex = require('knex')
const supertest = require('supertest')
const app = require('../src/app')
const { makeNotesArray, makeMaliciousNote } = require('./notes.fixtures')

describe('Note endpoints', () => {
  let db

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
  })

  before('clean the table', () =>
    db.raw('TRUNCATE noteful_notes RESTART IDENTITY CASCADE')
  )

  after('disconnect from db', () => db.destroy())

  afterEach('cleanup', () =>
    db.raw('TRUNCATE noteful_notes RESTART IDENTITY CASCADE')
  )

  describe('GET /api/notes', () => {
    context(`Given no notes`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app).get('/api/notes').expect(200, [])
      })
    })

    context('Given there are notes in the database', () => {
      const testNotes = makeNotesArray()

      beforeEach('insert notes', () => {
        return db.into('noteful_notes').insert(testNotes)
      })

      it('GET /api/notes responds with 200 and all notes', () => {
        return supertest(app).get('/api/notes').expect(200, testNotes)
      })
    })

    context(`Given an XSS attack notes`, () => {
      const maliciousNote = makeMaliciousNote()

      beforeEach('insert malicious note', () => {
        return db.into('noteful_notes').insert([maliciousNote])
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/notes`)
          .expect(200)
          .expect((res) => {
            expect(res.body[0].title).to.eql(
              'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;'
            )
            expect(res.body[0].content).to.eql(
              `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
            )
          })
      })
    })
  })

  describe('POST /api/notes', () => {
    it('creates an notes, responds with 201 and the new note', function () {
      this.retries(3)
      const newNote = {
        title: 'Test new note',
        content: 'Test new note content...',
      }
      return supertest(app)
        .post('/api/notes')
        .send(newNote)
        .expect(201)
        .expect((res) => {
          expect(res.body.title).to.eql(newNote.title)
          expect(res.body.content).to.eql(newNote.content)
          expect(res.body).to.have.property('id')
          expect(res.headers.location).to.eql(`/api/articles/${res.body.id}`)
          const expected = new Date().toLocaleDateString()
          const actual = new Date(res.body.date_published).toLocaleDateString()
          expect(actual).to.eql(expected)
        })
        .then((postRes) =>
          supertest(app)
            .get(`/api/articles/${postRes.body.id}`)
            .expect(postRes.body)
        )
    })

    const fields = ['title', 'content']
    fields.forEach((field) => {
      const newNote = {
        title: 'Test new note',
        content: 'Test new note content...',
      }
      it(`responds with 400 and an error message when ${field} field is missing`, () => {
        delete newNote[field]
        return supertest(app)
          .post('/api/notes')
          .send(newNote)
          .expect(400, {
            error: { message: `Missing ${field} in request body` },
          })
      })
    })

    context(
      `When an XSS attack note is put in, note is sanitized right away`,
      () => {
        const maliciousNote = makeMaliciousNote()

        it('removes XSS attack content', () => {
          return supertest(app)
            .post(`/api/notes`)
            .send(maliciousNote)
            .expect(201)
            .expect((res) => {
              expect(res.body.title).to.eql(
                'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;'
              )
              expect(res.body.content).to.eql(
                `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
              )
            })
        })
      }
    )
  })

  describe(`DELETE /api/notes`, () => {
    context(`Given no notes`, () => {
      it(`responds with 404`, () => {
        const noteId = 123456
        return supertest(app)
          .delete(`/api/notes/${noteId}`)
          .expect(404, { error: { message: `Note doesn't exist` } })
      })
    })

    context('Given there are notes in the database', () => {
      const testNotes = makeNotesArray()

      beforeEach('insert notes', () => {
        return db.into('noteful_notes').insert(testNotes)
      })

      it('responds with 204 and removes the note', () => {
        const idToRemove = 2
        const expectedNotes = testNotes.filter(
          (article) => article.id !== idToRemove
        )
        return supertest(app)
          .delete(`/api/notes/${idToRemove}`)
          .expect(204)
          .then((res) => supertest(app).get(`/api/notes`).expect(expectedNotes))
      })
    })
  })
})
