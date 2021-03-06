(function() {
  var File, Model, fs, path,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  path = require('path');

  fs = require('fs-plus');

  Model = require('theorist').Model;

  module.exports = File = (function(_super) {
    __extends(File, _super);

    File.properties({
      file: null,
      status: null
    });

    File.prototype.accessor('name', function() {
      return this.file.getBaseName();
    });

    File.prototype.accessor('symlink', function() {
      return this.file.symlink;
    });

    File.prototype.accessor('type', function() {
      var extension;
      extension = path.extname(this.path);
      if (fs.isReadmePath(this.path)) {
        return 'readme';
      } else if (fs.isCompressedExtension(extension)) {
        return 'compressed';
      } else if (fs.isImageExtension(extension)) {
        return 'image';
      } else if (fs.isPdfExtension(extension)) {
        return 'pdf';
      } else if (fs.isBinaryExtension(extension)) {
        return 'binary';
      } else {
        return 'text';
      }
    });

    function File() {
      var error, repo;
      File.__super__.constructor.apply(this, arguments);
      repo = atom.project.getRepo();
      try {
        this.path = fs.realpathSync(this.file.getPath());
      } catch (_error) {
        error = _error;
        this.path = this.file.getPath();
      }
      if (repo != null) {
        this.subscribeToRepo(repo);
        this.updateStatus(repo);
      }
    }

    File.prototype.destroyed = function() {
      return this.unsubscribe();
    };

    File.prototype.subscribeToRepo = function() {
      var repo;
      repo = atom.project.getRepo();
      if (repo != null) {
        this.subscribe(repo, 'status-changed', (function(_this) {
          return function(changedPath, status) {
            if (changedPath === _this.path) {
              return _this.updateStatus(repo);
            }
          };
        })(this));
        return this.subscribe(repo, 'statuses-changed', (function(_this) {
          return function() {
            return _this.updateStatus(repo);
          };
        })(this));
      }
    };

    File.prototype.updateStatus = function(repo) {
      var newStatus, status;
      newStatus = null;
      if (repo.isPathIgnored(this.path)) {
        newStatus = 'ignored';
      } else {
        status = repo.getCachedPathStatus(this.path);
        if (repo.isStatusModified(status)) {
          newStatus = 'modified';
        } else if (repo.isStatusNew(status)) {
          newStatus = 'added';
        }
      }
      if (newStatus !== this.status) {
        return this.status = newStatus;
      }
    };

    return File;

  })(Model);

}).call(this);
