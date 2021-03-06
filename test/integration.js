/* global describe, it, beforeEach */

var spawn = require('child_process').spawn

describe('integration tests', function () {
  it('should run as a shell script with no arguments', function (done) {
    testCmd('./bin.js', [], done)
  })

  it('should run as a shell script with arguments', function (done) {
    testCmd('./bin.js', [ 'a', 'b', 'c' ], done)
  })

  it('should run as a node script with no arguments', function (done) {
    testCmd('node bin.js', [], done)
  })

  it('should run as a node script with arguments', function (done) {
    testCmd('node bin.js', [ 'x', 'y', 'z' ], done)
  })

  describe('path returned by "which"', function () {
    beforeEach(function () {
      this.which = spawn('which', ['node'])
    })

    it('should match the actual path to the script file', function (done) {
      this.which.stdout.on('data', function (buf) {
        testCmd(buf.toString().trim() + ' bin.js', [], done)
      })
      this.which.stderr.on('data', done)
    })

    it('should match the actual path to the script file, with arguments', function (done) {
      this.which.stdout.on('data', function (buf) {
        testCmd(buf.toString().trim() + ' bin.js', [ 'q', 'r' ], done)
      })
      this.which.stderr.on('data', done)
    })

  })

  // see #177
  it('allows --help to be completed without returning help message', function (done) {
    testCmd('./bin.js', [ '--get-yargs-completions', '--help' ], function (buf) {
      buf.should.not.match(/generate bash completion script/)
      buf.should.match(/--help/)
      return done()
    })
  })
})

function testCmd (cmd, args, done) {
  var oldDir = process.cwd()
  process.chdir(__dirname + '/fixtures')

  var cmds = cmd.split(' ')

  var bin = spawn(cmds[0], cmds.slice(1).concat(args.map(String)))
  process.chdir(oldDir)

  bin.stderr.on('data', done)

  bin.stdout.on('data', function (buf) {
    // hack to allow us to assert against completion suggestions.
    if (~args.indexOf('--get-yargs-completions')) return done(buf.toString())

    var _ = JSON.parse(buf.toString())
    _.map(String).should.deep.equal(args.map(String))
    done()
  })
}
