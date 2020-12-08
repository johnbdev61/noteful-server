/* eslint-disable semi */
function makeNotesArray() {
  return [
    {
      id: 1,
      title: 'Note One',
      content: 'This is a note that is note one',
      date_published: Date.now(),
      folder: 1,
    },
    {
      id: 2,
      title: 'Note Two',
      content: 'This is a note that is note two',
      date_published: Date.now(),
      folder: 2,
    },
    {
      id: 3,
      title: 'Note Three',
      content: 'This is a note that is note three',
      date_published: Date.now(),
      folder: 3,
    },
  ]
}

function makeMaliciousNote() {
  const maliciousNote = {
    id: 666,
    title: 'Naughty naughty very naughty <script>alert("xss");</script>',
    content: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
    date_published: new Date().toISOString(),
    folder: 1,
  }
  const expectedNote = {
    ...maliciousNote,
    title:
      'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;',
    content: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
  }
  return {
    maliciousNote,
    expectedNote,
  }
}

module.exports = { makeNotesArray, makeMaliciousNote }
