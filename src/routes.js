var express = require('express')
var router = express.Router()
var netbeast = require('netbeast')
// Require the discovery function
var loadResources = require('./resources')

var access_token = []

loadResources(function (err, token) {
  if (err) {
    console.trace(new Error(err))
    netbeast().error(err, 'Something wrong!')
  }

  access_token = token

  router.get('/:id', function (req, res, next) {

      var response = {}
      async.forEachOf(req.query, function (value, key, callback) {
        switch (key) {
          case 'locks':
          case 'keys':
          case 'activity':
            var url = (key === 'locks') ? '' : (key === 'keys' ? '/keys' : '/activity')
            request.get({
              url: 'https://api.lockitron.com/v2/locks/' + req.params.id + url,
              qs: {access_token: access_token}
            }, function (err, response, body) {
              if (err) callback(new Error(err))
              else {
                response[key] = JSON.parse(body)
                callback()
              }
            })
          break
          case 'users':
          request.get({
            url: 'https://api.lockitron.com/v2/users/me',
            qs: {access_token: access_token}
          }, function (err, response, body) {
            if (err) callback(new Error(err))
            else {
              response[key] = JSON.parse(body)
              callback()
            }
          })
          break
          default:
          callback()
          break
        }
      }, function (err) {
        if (err) console.trace(err)
        if (Object.keys(response).length) return res.json(response)
        return res.status(400).send('Values not available on Netatmo Welcome')
      })
    })
  })

  router.get('/discover', function (req, res, next) {
    loadResources(function (err, access_token) {
      if (err) {
        console.trace(new Error(err))
        netbeast().error(err, 'Something wrong!')
      }
      access_token = token
    })
  })

  router.post('/:id', function (req, res, next) {
    var validate = []
    if (req.body.access_token) {
      if (req.body.state || req.body.noblock || req.body.sleep_period) {
        validate = ['access_token', 'state', 'noblock', 'sleep_period']
        Object.keys(req.body).forEach(function (key) {
          if (validate.indexOf(key) < 0) delete req.body[key]
        })
        console.log(req.body)
        request.put({
          url: 'https://api.lockitron.com/v2/locks/' + req.params.id,
          json: req.body
        }, function (err, response, body) {
          if (err) res.status(404).send({ error: 'Value not available' })
          else res.send(true)
        })
      } else if ((req.body.email || req.body.phone) && req.body.name && req.body.start_date && req.body.expiration_date && req.body.role) {
        validate = ['access_token', 'email', 'phone', 'name', 'start_date', 'expiration_date', 'role']
        if (Object.keys(req.body).length > 6) {
          Object.keys(req.body).forEach(function (key) {
            if (validate.indexOf(key) < 0) delete req.body[key]
          })
        }
        console.log(req.body)
        request.put({
          url: 'https://api.lockitron.com/v2/locks/' + req.params.id + '/keys',
          json: req.body
        }, function (err, response, body) {
          if (err) res.status(404).send({ error: 'Value not available' })
          else res.send(true)
        })
      }
    } else res.status(404).send({ error: 'Access token missing' })
  })
})

// Used to serve the routes
module.exports = router
