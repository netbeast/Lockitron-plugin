var async = require('async'),
    fs = require('fs-extra'),
    netbeast = require('netbeast'),
    request = require('request')

const API = 'http://' + process.env.NETBEAST + '/api/resources'

var devices = []
var access_token

module.exports = function (callback) {
  fs.readJson('./src/settings/config.json', function (err, packageObj) {
    if (err) console.trace(err)
    if (!packageObj.access_token) return (new Error('Settings required, go to the plugin settings and enter the data required'))

    access_token = packageObj.access_token

    request.get({
      url: 'https://api.lockitron.com/v2/locks/',
      qs: {access_token: packageObj.access_token}
    }, function (err, response, body) {
      if (err) return callback(new Error(err))
      else {
        var result = JSON.parse(body)
        var hooks = []
        async.forEachOf(result, function (value, key, callback) {
          hooks.push(value.id)
          callback()
        }, function (err) {
          callback(new Error(err))
          netbeast('locker').updateDB({ app: 'lockitron', hook: hooks })
        })
      }
    })
  })
  return callback(null, access_token)
}
