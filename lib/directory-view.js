(function() {
  var $, Directory, DirectoryView, File, FileView, View, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ref = require('atom'), $ = _ref.$, View = _ref.View;

  Directory = require('./directory');

  FileView = require('./file-view');

  File = require('./file');

  module.exports = DirectoryView = (function(_super) {
    __extends(DirectoryView, _super);

    function DirectoryView() {
      return DirectoryView.__super__.constructor.apply(this, arguments);
    }

    DirectoryView.content = function() {
      return this.li({
        "class": 'directory entry list-nested-item collapsed'
      }, (function(_this) {
        return function() {
          _this.div({
            outlet: 'header',
            "class": 'header list-item'
          }, function() {
            return _this.span({
              "class": 'name icon',
              outlet: 'directoryName'
            });
          });
          return _this.ol({
            "class": 'entries list-tree',
            outlet: 'entries'
          });
        };
      })(this));
    };

    DirectoryView.prototype.initialize = function(directory) {
      var iconClass, relativeDirectoryPath, _ref1;
      this.directory = directory;
      if (this.directory.symlink) {
        iconClass = 'icon-file-symlink-directory';
      } else {
        iconClass = 'icon-file-directory';
        if (this.directory.isRoot) {
          if ((_ref1 = atom.project.getRepo()) != null ? _ref1.isProjectAtRoot() : void 0) {
            iconClass = 'icon-repo';
          }
        } else {
          if (this.directory.submodule) {
            iconClass = 'icon-file-submodule';
          }
        }
      }
      this.directoryName.addClass(iconClass);
      this.directoryName.text(this.directory.name);
      relativeDirectoryPath = atom.project.relativize(this.directory.path);
      this.directoryName.attr('data-name', this.directory.name);
      this.directoryName.attr('data-path', relativeDirectoryPath);
      if (!this.directory.isRoot) {
        this.subscribe(this.directory.$status.onValue((function(_this) {
          return function(status) {
            _this.removeClass('status-ignored status-modified status-added');
            if (status != null) {
              return _this.addClass("status-" + status);
            }
          };
        })(this)));
      }
      if (this.directory.isExpanded) {
        return this.expand();
      }
    };

    DirectoryView.prototype.beforeRemove = function() {
      return this.directory.destroy();
    };

    DirectoryView.prototype.subscribeToDirectory = function() {
      this.subscribe(this.directory, 'entry-added', (function(_this) {
        return function(entry) {
          var insertionIndex, view;
          view = _this.createViewForEntry(entry);
          insertionIndex = entry.indexInParentDirectory;
          if (insertionIndex < _this.entries.children().length) {
            return _this.entries.children().eq(insertionIndex).before(view);
          } else {
            return _this.entries.append(view);
          }
        };
      })(this));
      return this.subscribe(this.directory, 'entry-added entry-removed', (function(_this) {
        return function() {
          if (_this.isExpanded) {
            return _this.trigger('tree-view:directory-modified');
          }
        };
      })(this));
    };

    DirectoryView.prototype.getPath = function() {
      return this.directory.path;
    };

    DirectoryView.prototype.createViewForEntry = function(entry) {
      var subscription, view;
      if (entry instanceof Directory) {
        view = new DirectoryView(entry);
      } else {
        view = new FileView(entry);
      }
      subscription = this.subscribe(this.directory, 'entry-removed', function(removedEntry) {
        if (entry === removedEntry) {
          view.remove();
          return subscription.off();
        }
      });
      return view;
    };

    DirectoryView.prototype.reload = function() {
      if (this.isExpanded) {
        return this.directory.reload();
      }
    };

    DirectoryView.prototype.toggleExpansion = function(isRecursive) {
      if (isRecursive == null) {
        isRecursive = false;
      }
      if (this.isExpanded) {
        return this.collapse(isRecursive);
      } else {
        return this.expand(isRecursive);
      }
    };

    DirectoryView.prototype.expand = function(isRecursive) {
      var child, childView, _i, _len, _ref1;
      if (isRecursive == null) {
        isRecursive = false;
      }
      if (!this.isExpanded) {
        this.addClass('expanded').removeClass('collapsed');
        this.subscribeToDirectory();
        this.directory.expand();
        this.isExpanded = true;
      }
      if (isRecursive) {
        _ref1 = this.entries.children();
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          child = _ref1[_i];
          childView = $(child).view();
          if (childView instanceof DirectoryView) {
            childView.expand(true);
          }
        }
      }
      return false;
    };

    DirectoryView.prototype.collapse = function(isRecursive) {
      var child, childView, _i, _len, _ref1;
      if (isRecursive == null) {
        isRecursive = false;
      }
      if (isRecursive) {
        _ref1 = this.entries.children();
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          child = _ref1[_i];
          childView = $(child).view();
          if (childView instanceof DirectoryView && childView.isExpanded) {
            childView.collapse(true);
          }
        }
      }
      this.removeClass('expanded').addClass('collapsed');
      this.directory.collapse();
      this.unsubscribe(this.directory);
      this.entries.empty();
      return this.isExpanded = false;
    };

    return DirectoryView;

  })(View);

}).call(this);
