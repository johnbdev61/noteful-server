/* eslint-disable semi */
const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeFoldersArray } = require('./folders.fixtures')


describe('Folder Endpoints', function () {
  let db

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('clean the table', () =>
    db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE')
  )

  afterEach('cleanup', () =>
    db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE')
  )

  describe(`GET /api/folders`, () => {
    context('Given there are folders in the database', () => {
      const testFolders = makeFoldersArray()

      beforeEach('insert folders', () => {
        return db.into('noteful_folders').insert(testFolders)
      })

      it('GET /api/folders repsponds with 200 and all of the folders', () => {
        return supertest(app).get('/api/folders').expect(200, testFolders)
      })
    })

    context(`Given no folders`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app).get('/api/folders').expect(200, [])
      })
    })
  })

  describe(`GET /api/folders/:folder_id`, () => {
    context('Given there are folders in the database', () => {
      const testFolders = makeFoldersArray()

      beforeEach('insert folders', () => {
        return db.into('noteful_folders').insert(testFolders)
      })

      it('GET /api/folders/:folder_id repsponds with 200 and folder matching id', () => {
        const idToGet = 2
        const expectedFolder = { id: 2, title: 'Cats' }
        return supertest(app)
          .get(`/api/folders/${idToGet}`)
          .expect(200, expectedFolder)
      })
    })
  })
})
