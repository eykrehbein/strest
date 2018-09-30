const express = require('express');
const bodyParser = require('body-parser');

const bookData = require('./books.json');

const app = express();
app.use(bodyParser.json());

app.get('/books/:isbn', (req, res) => { 
  // check if user is authorized
  const auth = req.headers.authorization;
  if(auth !== 'authToken123') {
    res.sendStatus(403)
    return;
  }
  const isbn = req.params.isbn;

  for(let book of bookData.books) {
    if(book.isbn === isbn) {
      res.status(200).send(book)
      return;
    }
  }
});

app.listen(3000, () => {
  console.log('Server listening');
});