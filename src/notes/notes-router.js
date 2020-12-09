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
              folder: note.folder,
            }
          })
        }
        return notes
      })
      .then((notes) => res.json(notes))
      .catch(next)
  })
  .post((req, res, next) => {
    const { title, content, folder } = req.body
    let newNote = {
      title,
      content,
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
      folder: folder,
    }

    NotesService.insertNote(req.app.get('db'), newNote)
      .then(([note]) => {
        res.status(201).location(`/notes/${note.id}`).json(note)
      })
      .catch(next)
  })

notesRouter
  .route('/:note_id')
  .all((req, res, next) => {
    NotesService.getById(req.app.get('db'), req.params.note_id)
      .then((note) => {
        if (!note) {
          return res.status(404).json({
            error: { message: `Note doesn't exist` },
          })
        }
        res.note = note //save the article for the next middleware
        next() // don't forget to call next so the next middleware happens!
      })
      .catch(next)
  })
  .get((req, res, next) => {
    res.json({
      id: res.note.id,
      title: xss(res.note.title),
      content: xss(res.note.content),
      date_published: res.note.date_published,
      folder: res.note.folder,
    })
  })
  .delete((req, res, next) => {
    NotesService.deleteNote(req.app.get('db'), req.params.note_id)
      .then(() => {
        res.status(204).end()
      })
      .catch(next)
  })

module.exports = notesRouter
