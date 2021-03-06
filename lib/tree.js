(function() {
  var path;

  path = require('path');

  module.exports = {
    configDefaults: {
      hideVcsIgnoredFiles: false,
      hideIgnoredNames: false,
      showOnRightSide: false
    },
    treeView: null,
    activate: function(state) {
      var _base;
      this.state = state;
      if (this.shouldAttach()) {
        if ((_base = this.state).attached == null) {
          _base.attached = true;
        }
      }
      if (this.state.attached) {
        this.createView();
      }
      atom.workspaceView.command('tree-view:show', (function(_this) {
        return function() {
          return _this.createView().show();
        };
      })(this));
      atom.workspaceView.command('tree-view:toggle', (function(_this) {
        return function() {
          return _this.createView().toggle();
        };
      })(this));
      atom.workspaceView.command('tree-view:toggle-focus', (function(_this) {
        return function() {
          return _this.createView().toggleFocus();
        };
      })(this));
      atom.workspaceView.command('tree-view:reveal-active-file', (function(_this) {
        return function() {
          return _this.createView().revealActiveFile();
        };
      })(this));
      atom.workspaceView.command('tree-view:toggle-side', (function(_this) {
        return function() {
          return _this.createView().toggleSide();
        };
      })(this));
      atom.workspaceView.command('tree-view:add-file', (function(_this) {
        return function() {
          return _this.createView().add(true);
        };
      })(this));
      atom.workspaceView.command('tree-view:add-folder', (function(_this) {
        return function() {
          return _this.createView().add(false);
        };
      })(this));
      atom.workspaceView.command('tree-view:duplicate', (function(_this) {
        return function() {
          return _this.createView().copySelectedEntry();
        };
      })(this));
      return atom.workspaceView.command('tree-view:remove', (function(_this) {
        return function() {
          return _this.createView().removeSelectedEntries();
        };
      })(this));
    },
    deactivate: function() {
      var _ref;
      if ((_ref = this.treeView) != null) {
        _ref.deactivate();
      }
      return this.treeView = null;
    },
    serialize: function() {
      if (this.treeView != null) {
        return this.treeView.serialize();
      } else {
        return this.state;
      }
    },
    createView: function() {
      var TreeView;
      if (this.treeView == null) {
        TreeView = require('./tree-view');
        this.treeView = new TreeView(this.state);
      }
      return this.treeView;
    },
    shouldAttach: function() {
      if (atom.workspace.getActivePaneItem()) {
        return false;
      } else if (path.basename(atom.project.getPath()) === '.git') {
        return atom.project.getPath() === atom.getLoadSettings().pathToOpen;
      } else {
        return true;
      }
    }
  };

}).call(this);
