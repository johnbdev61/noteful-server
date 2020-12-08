/* eslint-disable semi */
const path = require('path')
const express = require('express')
const FoldersService = require('./folders-service')
const xss = require('xss')

const foldersRouter = express.Router()

foldersRouter
  .route('/')
  .get((req, res, next) => {
    FoldersService.getAllFolders(req.app.get('db'))
      .then((folders) => {
        if (folders.length !== 0) {
          folders = folders.map((folder) => {
            return {
              id: folder.id,
              title: xss(folder.title), // sanitize title
            }
          })
        }
        return folders
      })
      .then((folders) => res.json(folders))
      .catch(next)
  })
  .post((req, res, next) => {
    const { title } = req.body
    let newFolder = {
      title,
    }

    for (const [title, value] of Object.entries(newFolder)) {
      if (title == null) {
        return res.status(400).json({
          error: { message: `You must enter a title` },
        })
      }
    }

    newFolder = {
      title: xss(title),
    }

    FoldersService.insertFolder(req.app.get('db'), newFolder)
      .then((folder) => {
        res.status(201).location(`/folders/${folder.id}`).json(folder)
      })
      .catch(next)
  })

module.exports = foldersRouter
