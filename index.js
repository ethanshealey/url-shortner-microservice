const express = require('express')
const cors = require('cors')
const path = require('path')
const MongoClient = require('mongodb').MongoClient
const dotenv = require('dotenv')
const dns = require('dns')
const app = express()

dotenv.config()

app.use(express.json())
app.use(express.urlencoded())

app.get('/', (req, res) => {
  res.sendFile('./public/index.html', { root: __dirname })
})

app.post('/api/shorturl', (req, res) => {
  const URL = req.body.url
  dns.lookup(URL.replace(/^http[s]?:\/\//, ''), (err, addr, fam) => {
    if(err) {
      console.log(err)
      return res.json({ 'error': 'invalid url' })
    }
    console.log('hi')
    MongoClient.connect(process.env.MONGO_URI, (err, client) => {
      if(err) return res.json(err)
      console.log('hi2')
      client.db('url-shortner').collection('urls').findOne({ 'original_url': URL }).then((item) => {
        if(item) return res.json({ 'original_url': item.original_url, 'short_url': item.short_url })
        client.db('url-shortner').collection('urls').find().toArray((err, arr) => {
          const id = Math.max.apply(Math, arr.map((url) => { return url.short_url })) + 1
          const obj = { 'original_url': URL, 'short_url': id }
          client.db('url-shortner').collection('urls').insertOne(obj)
          return res.json(obj) 
        })
      })
    })
  })
})

app.get('/api/shorturl/:id', (req, res) => {
  MongoClient.connect(process.env.MONGO_URI, (err, client) => {
    client.db('url-shortner').collection('urls').findOne({ short_url: req.params.id * 1}, (err, item) => {
     if(err) return res.json({ 'error': err })
     if(item) {
       return res.redirect(item.original_url)
     }
     else return res.json({ 'error': 'No short URL found for the given input' })
    })
  })
})

app.listen(process.env.PORT || 3001, () => {
  console.log(`listening on port ${process.env.PORT || 3001}`)
})
