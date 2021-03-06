(function() {
  var CopyDialog, Dialog, fs, path,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  path = require('path');

  fs = require('fs-plus');

  Dialog = require('./dialog');

  module.exports = CopyDialog = (function(_super) {
    __extends(CopyDialog, _super);

    function CopyDialog(initialPath) {
      this.initialPath = initialPath;
      CopyDialog.__super__.constructor.call(this, {
        prompt: 'Enter the new path for the duplicate.',
        initialPath: atom.project.relativize(this.initialPath),
        select: true,
        iconClass: 'icon-arrow-right'
      });
    }

    CopyDialog.prototype.onConfirm = function(newPath) {
      var activeEditor, error, repo;
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
      activeEditor = atom.workspace.getActiveEditor();
      if ((activeEditor != null ? activeEditor.getPath() : void 0) !== this.initialPath) {
        activeEditor = null;
      }
      try {
        if (fs.isDirectorySync(this.initialPath)) {
          fs.copySync(this.initialPath, newPath);
        } else {
          fs.copy(this.initialPath, newPath, function() {
            return atom.workspace.open(newPath, {
              activatePane: true,
              initialLine: activeEditor != null ? activeEditor.getCursor().getBufferRow() : void 0,
              initialColumn: activeEditor != null ? activeEditor.getCursor().getBufferColumn() : void 0
            });
          });
        }
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

    CopyDialog.prototype.isNewPathValid = function(newPath) {
      var newStat, oldStat;
      try {
        oldStat = fs.statSync(this.initialPath);
        newStat = fs.statSync(newPath);
        return this.initialPath.toLowerCase() === newPath.toLowerCase() && oldStat.dev === newStat.dev && oldStat.ino === newStat.ino;
      } catch (_error) {
        return true;
      }
    };

    return CopyDialog;

  })(Dialog);

}).call(this);
