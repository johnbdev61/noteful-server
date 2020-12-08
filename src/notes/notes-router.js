/* eslint-disable semi */
const express = require('express')
const NotesService = require('./notes-service')
const xss = require('xss')

const notesRouter = express.Router()

notesRouter
  .route('/')
  .get((req, res, next) => {
    NotesService.getAllNotes(req.app.get('db'))
      .then((notes) => {
        if (notes.length !== 0) {
          notes = notes.map((note) => {
            return {
              id: note.id,
              title: xss(note.title), // sanitize title
              content: xss(note.content), // sanitize content
              date_published: note.date_published,
            }
          })
        }
        return notes
      })
      .then((notes) => res.json(notes))
      .catch(next)
  })
  .post((req, res, next) => {
    const { title, content, date_published, folder } = req.body
    let newNote = {
      title,
      content,
      date_published,
      folder,
    }

    for (const [key, value] of Object.entries(newNote)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing ${key} in request body` },
        })
      }
    }

    newNote = {
      title: xss(title),
      content: xss(content),
      date_published: date_published,
      folder: folder,
    }

    NotesService.insertNote(req.app.get('db'), newNote)
      .then((note) => {
        res.status(201).location(`/notes/${note.id}`).json(note)
      })
      .catch(next)
  })
  .delete((req, res, next) => {
    NotesService.deleteArticle(req.app.get('db'), req.params.note_id)
      .then(() => {
        res.status(204).end()
      })
      .catch(next)
  })

module.exports = notesRouter
