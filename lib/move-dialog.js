(function() {
  var Dialog, MoveDialog, fs, path,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  path = require('path');

  fs = require('fs-plus');

  Dialog = require('./dialog');

  module.exports = MoveDialog = (function(_super) {
    __extends(MoveDialog, _super);

    function MoveDialog(initialPath) {
      var prompt;
      this.initialPath = initialPath;
      if (fs.isDirectorySync(this.initialPath)) {
        prompt = 'Enter the new path for the directory.';
      } else {
        prompt = 'Enter the new path for the file.';
      }
      MoveDialog.__super__.constructor.call(this, {
        prompt: prompt,
        initialPath: atom.project.relativize(this.initialPath),
        select: true,
        iconClass: 'icon-arrow-right'
      });
    }

    MoveDialog.prototype.onConfirm = function(newPath) {
      var directoryPath, error, repo;
      newPath = atom.project.resolve(newPath);
      if (!newPath) {
        return;
      }
      if (this.initialPath === newPath) {
        this.close();
        return;
      }
      if (!this.isNewPathValid(newPath)) {
        this.showError("'" + newPath + "' already exists.");
        return;
      }
      directoryPath = path.dirname(newPath);
      try {
        if (!fs.existsSync(directoryPath)) {
          fs.makeTreeSync(directoryPath);
        }
        fs.moveSync(this.initialPath, newPath);
        if (repo = atom.project.getRepo()) {
          repo.getPathStatus(this.initialPath);
          repo.getPathStatus(newPath);
        }
        return this.close();
      } catch (_error) {
        error = _error;
        return this.showError("" + error.message + ".");
      }
    };

    MoveDialog.prototype.isNewPathValid = function(newPath) {
      var newStat, oldStat;
      try {
        oldStat = fs.statSync(this.initialPath);
        newStat = fs.statSync(newPath);
        return this.initialPath.toLowerCase() === newPath.toLowerCase() && oldStat.dev === newStat.dev && oldStat.ino === newStat.ino;
      } catch (_error) {
        return true;
      }
    };

    return MoveDialog;

  })(Dialog);

}).call(this);
