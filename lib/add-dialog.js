(function() {
  var AddDialog, Dialog, fs, path,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  path = require('path');

  fs = require('fs-plus');

  Dialog = require('./dialog');

  module.exports = AddDialog = (function(_super) {
    __extends(AddDialog, _super);

    function AddDialog(initialPath, isCreatingFile) {
      var directoryPath, relativeDirectoryPath;
      this.isCreatingFile = isCreatingFile;
      if (fs.isFileSync(initialPath)) {
        directoryPath = path.dirname(initialPath);
      } else {
        directoryPath = initialPath;
      }
      relativeDirectoryPath = atom.project.relativize(directoryPath);
      if (relativeDirectoryPath.length > 0) {
        relativeDirectoryPath += '/';
      }
      AddDialog.__super__.constructor.call(this, {
        prompt: "Enter the path for the new " + (isCreatingFile ? "file." : "folder."),
        initialPath: relativeDirectoryPath,
        select: false,
        iconClass: isCreatingFile ? 'icon-file-add' : 'icon-file-directory-create'
      });
    }

    AddDialog.prototype.onConfirm = function(relativePath) {
      var endsWithDirectorySeparator, error, pathToCreate, _ref;
      endsWithDirectorySeparator = /\/$/.test(relativePath);
      pathToCreate = atom.project.resolve(relativePath);
      if (!pathToCreate) {
        return;
      }
      try {
        if (fs.existsSync(pathToCreate)) {
          return this.showError("'" + pathToCreate + "' already exists.");
        } else if (this.isCreatingFile) {
          if (endsWithDirectorySeparator) {
            return this.showError("File names must not end with a '/' character.");
          } else {
            fs.writeFileSync(pathToCreate, '');
            if ((_ref = atom.project.getRepo()) != null) {
              _ref.getPathStatus(pathToCreate);
            }
            this.trigger('file-created', [pathToCreate]);
            return this.close();
          }
        } else {
          fs.makeTreeSync(pathToCreate);
          this.trigger('directory-created', [pathToCreate]);
          return this.cancel();
        }
      } catch (_error) {
        error = _error;
        return this.showError("" + error.message + ".");
      }
    };

    return AddDialog;

  })(Dialog);

}).call(this);
