(function() {
  var Directory, File, Model, path, _,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  path = require('path');

  Model = require('theorist').Model;

  _ = require('underscore-plus');

  File = require('./file');

  module.exports = Directory = (function(_super) {
    __extends(Directory, _super);

    Directory.properties({
      directory: null,
      isRoot: false,
      isExpanded: false,
      status: null,
      entries: function() {
        return {};
      },
      expandedEntries: function() {
        return {};
      }
    });

    Directory.prototype.accessor('name', function() {
      return this.directory.getBaseName() || this.path;
    });

    Directory.prototype.accessor('path', function() {
      return this.directory.getPath();
    });

    Directory.prototype.accessor('submodule', function() {
      var _ref;
      return (_ref = atom.project.getRepo()) != null ? _ref.isSubmodule(this.path) : void 0;
    });

    Directory.prototype.accessor('symlink', function() {
      return this.directory.symlink;
    });

    function Directory() {
      var repo;
      Directory.__super__.constructor.apply(this, arguments);
      repo = atom.project.getRepo();
      if (repo != null) {
        this.subscribeToRepo(repo);
        this.updateStatus(repo);
      }
    }

    Directory.prototype.destroyed = function() {
      this.unwatch();
      return this.unsubscribe();
    };

    Directory.prototype.subscribeToRepo = function(repo) {
      this.subscribe(repo, 'status-changed', (function(_this) {
        return function(changedPath, status) {
          if (changedPath.indexOf("" + _this.path + path.sep) === 0) {
            return _this.updateStatus(repo);
          }
        };
      })(this));
      return this.subscribe(repo, 'statuses-changed', (function(_this) {
        return function() {
          return _this.updateStatus(repo);
        };
      })(this));
    };

    Directory.prototype.updateStatus = function(repo) {
      var newStatus, status;
      newStatus = null;
      if (repo.isPathIgnored(this.path)) {
        newStatus = 'ignored';
      } else {
        status = repo.getDirectoryStatus(this.path);
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

    Directory.prototype.isPathIgnored = function(filePath) {
      var extension, ignoredNames, name, repo, _ref;
      if (atom.config.get('tree-view.hideVcsIgnoredFiles')) {
        repo = atom.project.getRepo();
        if ((repo != null) && repo.isProjectAtRoot() && repo.isPathIgnored(filePath)) {
          return true;
        }
      }
      if (atom.config.get('tree-view.hideIgnoredNames')) {
        ignoredNames = (_ref = atom.config.get('core.ignoredNames')) != null ? _ref : [];
        if (typeof ignoredNames === 'string') {
          ignoredNames = [ignoredNames];
        }
        name = path.basename(filePath);
        if (_.contains(ignoredNames, name)) {
          return true;
        }
        extension = path.extname(filePath);
        if (extension && _.contains(ignoredNames, "*" + extension)) {
          return true;
        }
      }
      return false;
    };

    Directory.prototype.createEntry = function(entry, index) {
      var expandedEntries, isExpanded;
      if (entry.getEntriesSync != null) {
        expandedEntries = this.expandedEntries[entry.getBaseName()];
        isExpanded = expandedEntries != null;
        entry = new Directory({
          directory: entry,
          isExpanded: isExpanded,
          expandedEntries: expandedEntries
        });
      } else {
        entry = new File({
          file: entry
        });
      }
      entry.indexInParentDirectory = index;
      return entry;
    };

    Directory.prototype.contains = function(pathToCheck) {
      return this.directory.contains(pathToCheck);
    };

    Directory.prototype.unwatch = function() {
      var entry, key, _ref, _results;
      if (this.watchSubscription != null) {
        this.watchSubscription.off();
        this.watchSubscription = null;
        if (this.isAlive()) {
          _ref = this.entries;
          _results = [];
          for (key in _ref) {
            entry = _ref[key];
            entry.destroy();
            _results.push(delete this.entries[key]);
          }
          return _results;
        }
      }
    };

    Directory.prototype.watch = function() {
      if (this.watchSubscription == null) {
        this.watchSubscription = this.directory.on('contents-changed', (function(_this) {
          return function() {
            return _this.reload();
          };
        })(this));
        return this.subscribe(this.watchSubscription);
      }
    };

    Directory.prototype.reload = function() {
      var entry, index, name, newEntries, removedEntries, _i, _j, _len, _len1, _ref, _ref1, _results;
      newEntries = [];
      removedEntries = _.clone(this.entries);
      index = 0;
      _ref = this.directory.getEntriesSync();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        entry = _ref[_i];
        name = entry.getBaseName();
        if (this.entries.hasOwnProperty(name)) {
          delete removedEntries[name];
          index++;
        } else if (!this.isPathIgnored(entry.path)) {
          newEntries.push([entry, index]);
          index++;
        }
      }
      for (name in removedEntries) {
        entry = removedEntries[name];
        entry.destroy();
        delete this.entries[name];
        delete this.expandedEntries[name];
        this.emit('entry-removed', entry);
      }
      _results = [];
      for (_j = 0, _len1 = newEntries.length; _j < _len1; _j++) {
        _ref1 = newEntries[_j], entry = _ref1[0], index = _ref1[1];
        entry = this.createEntry(entry, index);
        this.entries[entry.name] = entry;
        _results.push(this.emit('entry-added', entry));
      }
      return _results;
    };

    Directory.prototype.collapse = function() {
      this.isExpanded = false;
      this.expandedEntries = this.serializeExpansionStates();
      return this.unwatch();
    };

    Directory.prototype.expand = function() {
      this.isExpanded = true;
      this.reload();
      return this.watch();
    };

    Directory.prototype.serializeExpansionStates = function() {
      var entry, expandedEntries, name, _ref;
      expandedEntries = {};
      _ref = this.entries;
      for (name in _ref) {
        entry = _ref[name];
        if (entry.isExpanded) {
          expandedEntries[name] = entry.serializeExpansionStates();
        }
      }
      return expandedEntries;
    };

    return Directory;

  })(Model);

}).call(this);
