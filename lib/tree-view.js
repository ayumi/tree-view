(function() {
  var $, AddDialog, BufferedProcess, CopyDialog, Directory, DirectoryView, File, FileView, LocalStorage, MoveDialog, ScrollView, TreeView, fs, path, shell, _, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  path = require('path');

  shell = require('shell');

  _ = require('underscore-plus');

  _ref = require('atom'), $ = _ref.$, BufferedProcess = _ref.BufferedProcess, ScrollView = _ref.ScrollView;

  fs = require('fs-plus');

  AddDialog = null;

  MoveDialog = null;

  CopyDialog = null;

  Directory = require('./directory');

  DirectoryView = require('./directory-view');

  File = require('./file');

  FileView = require('./file-view');

  LocalStorage = window.localStorage;

  module.exports = TreeView = (function(_super) {
    __extends(TreeView, _super);

    function TreeView() {
      this.resizeTreeView = __bind(this.resizeTreeView, this);
      this.resizeStopped = __bind(this.resizeStopped, this);
      this.resizeStarted = __bind(this.resizeStarted, this);
      return TreeView.__super__.constructor.apply(this, arguments);
    }

    TreeView.content = function() {
      return this.div({
        "class": 'tree-view-resizer tool-panel',
        'data-show-on-right-side': atom.config.get('tree-view.showOnRightSide')
      }, (function(_this) {
        return function() {
          _this.div({
            "class": 'tree-view-scroller',
            outlet: 'scroller'
          }, function() {
            return _this.ol({
              "class": 'tree-view full-menu list-tree has-collapsable-children focusable-panel',
              tabindex: -1,
              outlet: 'list'
            });
          });
          return _this.div({
            "class": 'tree-view-resize-handle',
            outlet: 'resizeHandle'
          });
        };
      })(this));
    };

    TreeView.prototype.initialize = function(state) {
      var focusAfterAttach, root, scrollLeftAfterAttach, scrollTopAfterAttach, selectedPath;
      TreeView.__super__.initialize.apply(this, arguments);
      focusAfterAttach = false;
      root = null;
      scrollLeftAfterAttach = -1;
      scrollTopAfterAttach = -1;
      selectedPath = null;
      this.on('dblclick', '.tree-view-resize-handle', (function(_this) {
        return function() {
          return _this.resizeToFitContent();
        };
      })(this));
      this.on('click', '.entry', (function(_this) {
        return function(e) {
          if (!(e.shiftKey || e.metaKey || e.ctrlKey)) {
            return _this.entryClicked(e);
          }
        };
      })(this));
      this.on('mousedown', '.entry', (function(_this) {
        return function(e) {
          var currentTarget, entryToSelect;
          e.stopPropagation();
          currentTarget = $(e.currentTarget);
          if (_this.multiSelectEnabled() && currentTarget.hasClass('selected') && (e.button === 2 || e.ctrlKey && process.platform === 'darwin')) {
            return;
          }
          entryToSelect = currentTarget.view();
          if (e.shiftKey) {
            _this.selectContinuousEntries(entryToSelect);
            return _this.showMultiSelectMenu();
          } else if (e.metaKey || (e.ctrlKey && process.platform !== 'darwin')) {
            _this.selectMultipleEntries(entryToSelect);
            if (_this.selectedPaths().length > 1) {
              return _this.showMultiSelectMenu();
            }
          } else {
            _this.selectEntry(entryToSelect);
            return _this.showFullMenu();
          }
        };
      })(this));
      this.off('core:move-up');
      this.off('core:move-down');
      this.on('mousedown', '.tree-view-resize-handle', (function(_this) {
        return function(e) {
          return _this.resizeStarted(e);
        };
      })(this));
      this.command('core:move-up', (function(_this) {
        return function() {
          return _this.moveUp();
        };
      })(this));
      this.command('core:move-down', (function(_this) {
        return function() {
          return _this.moveDown();
        };
      })(this));
      this.command('tree-view:expand-directory', (function(_this) {
        return function() {
          return _this.expandDirectory();
        };
      })(this));
      this.command('tree-view:recursive-expand-directory', (function(_this) {
        return function() {
          return _this.expandDirectory(true);
        };
      })(this));
      this.command('tree-view:collapse-directory', (function(_this) {
        return function() {
          return _this.collapseDirectory();
        };
      })(this));
      this.command('tree-view:recursive-collapse-directory', (function(_this) {
        return function() {
          return _this.collapseDirectory(true);
        };
      })(this));
      this.command('tree-view:open-selected-entry', (function(_this) {
        return function() {
          return _this.openSelectedEntry(true);
        };
      })(this));
      this.command('tree-view:move', (function(_this) {
        return function() {
          return _this.moveSelectedEntry();
        };
      })(this));
      this.command('tree-view:copy', (function(_this) {
        return function() {
          return _this.copySelectedEntries();
        };
      })(this));
      this.command('tree-view:cut', (function(_this) {
        return function() {
          return _this.cutSelectedEntries();
        };
      })(this));
      this.command('tree-view:paste', (function(_this) {
        return function() {
          return _this.pasteEntries();
        };
      })(this));
      this.command('tree-view:copy-full-path', (function(_this) {
        return function() {
          return _this.copySelectedEntryPath(false);
        };
      })(this));
      this.command('tree-view:show-in-file-manager', (function(_this) {
        return function() {
          return _this.showSelectedEntryInFileManager();
        };
      })(this));
      this.command('tree-view:open-in-new-window', (function(_this) {
        return function() {
          return _this.openSelectedEntryInNewWindow();
        };
      })(this));
      this.command('tree-view:copy-project-path', (function(_this) {
        return function() {
          return _this.copySelectedEntryPath(true);
        };
      })(this));
      this.command('tool-panel:unfocus', (function(_this) {
        return function() {
          return _this.unfocus();
        };
      })(this));
      this.command('tree-view:toggleVcsIgnoredFiles', (function(_this) {
        return function() {
          return atom.config.toggle('tree-view.hideVcsIgnoredFiles');
        };
      })(this));
      this.on('tree-view:directory-modified', (function(_this) {
        return function() {
          if (_this.hasFocus()) {
            if (_this.selectedPath) {
              return _this.selectEntryForPath(_this.selectedPath);
            }
          } else {
            return _this.selectActiveFile();
          }
        };
      })(this));
      this.subscribe(atom.workspaceView, 'pane-container:active-pane-item-changed', (function(_this) {
        return function() {
          return _this.selectActiveFile();
        };
      })(this));
      this.subscribe(atom.project, 'path-changed', (function(_this) {
        return function() {
          return _this.updateRoot();
        };
      })(this));
      this.subscribe(atom.config.observe('tree-view.hideVcsIgnoredFiles', {
        callNow: false
      }, (function(_this) {
        return function() {
          return _this.updateRoot();
        };
      })(this)));
      this.subscribe(atom.config.observe('tree-view.hideIgnoredNames', {
        callNow: false
      }, (function(_this) {
        return function() {
          return _this.updateRoot();
        };
      })(this)));
      this.subscribe(atom.config.observe('core.ignoredNames', {
        callNow: false
      }, (function(_this) {
        return function() {
          if (atom.config.get('tree-view.hideIgnoredNames')) {
            return _this.updateRoot();
          }
        };
      })(this)));
      this.subscribe(atom.config.observe('tree-view.showOnRightSide', {
        callNow: false
      }, (function(_this) {
        return function(newValue) {
          return _this.onSideToggled(newValue);
        };
      })(this)));
      this.updateRoot(state.directoryExpansionStates);
      if (this.root != null) {
        this.selectEntry(this.root);
      }
      if (state.selectedPath) {
        this.selectEntryForPath(state.selectedPath);
      }
      this.focusAfterAttach = state.hasFocus;
      if (state.scrollTop) {
        this.scrollTopAfterAttach = state.scrollTop;
      }
      if (state.scrollLeft) {
        this.scrollLeftAfterAttach = state.scrollLeft;
      }
      if (state.width > 0) {
        this.width(state.width);
      }
      if (state.attached) {
        return this.attach();
      }
    };

    TreeView.prototype.afterAttach = function(onDom) {
      if (this.focusAfterAttach) {
        this.focus();
      }
      if (this.scrollLeftAfterAttach > 0) {
        this.scroller.scrollLeft(this.scrollLeftAfterAttach);
      }
      if (this.scrollTopAfterAttach > 0) {
        return this.scrollTop(this.scrollTopAfterAttach);
      }
    };

    TreeView.prototype.beforeRemove = function() {
      return this.resizeStopped();
    };

    TreeView.prototype.serialize = function() {
      var _ref1, _ref2;
      return {
        directoryExpansionStates: (_ref1 = this.root) != null ? _ref1.directory.serializeExpansionStates() : void 0,
        selectedPath: (_ref2 = this.selectedEntry()) != null ? _ref2.getPath() : void 0,
        hasFocus: this.hasFocus(),
        attached: this.hasParent(),
        scrollLeft: this.scroller.scrollLeft(),
        scrollTop: this.scrollTop(),
        width: this.width()
      };
    };

    TreeView.prototype.deactivate = function() {
      return this.remove();
    };

    TreeView.prototype.toggle = function() {
      if (this.isVisible()) {
        return this.detach();
      } else {
        return this.show();
      }
    };

    TreeView.prototype.show = function() {
      if (!this.hasParent()) {
        this.attach();
      }
      return this.focus();
    };

    TreeView.prototype.attach = function() {
      if (!atom.project.getPath()) {
        return;
      }
      if (atom.config.get('tree-view.showOnRightSide')) {
        this.removeClass('panel-left');
        this.addClass('panel-right');
        return atom.workspaceView.appendToBottom(this);
      } else {
        this.removeClass('panel-right');
        this.addClass('panel-left');
        return atom.workspaceView.appendToLeft(this);
      }
    };

    TreeView.prototype.detach = function() {
      this.scrollLeftAfterAttach = this.scroller.scrollLeft();
      this.scrollTopAfterAttach = this.scrollTop();
      LocalStorage['tree-view:cutPath'] = null;
      LocalStorage['tree-view:copyPath'] = null;
      TreeView.__super__.detach.apply(this, arguments);
      return atom.workspaceView.focus();
    };

    TreeView.prototype.focus = function() {
      return this.list.focus();
    };

    TreeView.prototype.unfocus = function() {
      return atom.workspaceView.focus();
    };

    TreeView.prototype.hasFocus = function() {
      return this.list.is(':focus') || document.activeElement === this.list[0];
    };

    TreeView.prototype.toggleFocus = function() {
      if (this.hasFocus()) {
        return this.unfocus();
      } else {
        return this.show();
      }
    };

    TreeView.prototype.entryClicked = function(e) {
      var entry, isRecursive, _ref1, _ref2, _ref3;
      entry = $(e.currentTarget).view();
      isRecursive = e.altKey || false;
      switch ((_ref1 = (_ref2 = e.originalEvent) != null ? _ref2.detail : void 0) != null ? _ref1 : 1) {
        case 1:
          this.selectEntry(entry);
          if (entry instanceof FileView) {
            this.openSelectedEntry(false);
          }
          if (entry instanceof DirectoryView) {
            entry.toggleExpansion(isRecursive);
          }
          break;
        case 2:
          if (entry.is('.selected.file')) {
            if ((_ref3 = atom.workspaceView.getActiveView()) != null) {
              _ref3.focus();
            }
          } else if (entry.is('.selected.directory')) {
            entry.toggleExpansion(isRecursive);
          }
      }
      return false;
    };

    TreeView.prototype.resizeStarted = function() {
      $(document).on('mousemove', this.resizeTreeView);
      return $(document).on('mouseup', this.resizeStopped);
    };

    TreeView.prototype.resizeStopped = function() {
      $(document).off('mousemove', this.resizeTreeView);
      return $(document).off('mouseup', this.resizeStopped);
    };

    TreeView.prototype.resizeTreeView = function(_arg) {
      var pageX, pageY, which, width;
      pageX = _arg.pageX, pageY = _arg.pageY, which = _arg.which;
      if (which !== 1) {
        return this.resizeStopped();
      }
      if (atom.config.get('tree-view.showOnRightSide')) {
        height = $(document.body).height() - pageY;
        return this.height(height);
      } else {
        width = pageX;
        return this.width(width);
      }
    };

    TreeView.prototype.resizeToFitContent = function() {
      if (atom.config.get('tree-view.showOnRightSide')) {
        this.height(1);
        return this.height(this.list.outerHeight());
      } else {
        this.width(1);
        return this.width(this.list.outerWidth());
      }
    };

    TreeView.prototype.updateRoot = function(expandedEntries) {
      var directory, rootDirectory, _ref1;
      if (expandedEntries == null) {
        expandedEntries = {};
      }
      if ((_ref1 = this.root) != null) {
        _ref1.remove();
      }
      if (rootDirectory = atom.project.getRootDirectory()) {
        directory = new Directory({
          directory: rootDirectory,
          isExpanded: true,
          expandedEntries: expandedEntries,
          isRoot: true
        });
        this.root = new DirectoryView(directory);
        return this.list.append(this.root);
      } else {
        return this.root = null;
      }
    };

    TreeView.prototype.getActivePath = function() {
      var _ref1;
      return (_ref1 = atom.workspace.getActivePaneItem()) != null ? typeof _ref1.getPath === "function" ? _ref1.getPath() : void 0 : void 0;
    };

    TreeView.prototype.selectActiveFile = function() {
      var activeFilePath;
      if (activeFilePath = this.getActivePath()) {
        return this.selectEntryForPath(activeFilePath);
      } else {
        return this.deselect();
      }
    };

    TreeView.prototype.revealActiveFile = function() {
      var activeFilePath, activePathComponents, centeringOffset, currentPath, entry, pathComponent, _i, _len, _results;
      if (!atom.project.getPath()) {
        return;
      }
      this.attach();
      this.focus();
      if (!(activeFilePath = this.getActivePath())) {
        return;
      }
      activePathComponents = atom.project.relativize(activeFilePath).split(path.sep);
      currentPath = atom.project.getPath().replace(new RegExp("" + (_.escapeRegExp(path.sep)) + "$"), '');
      _results = [];
      for (_i = 0, _len = activePathComponents.length; _i < _len; _i++) {
        pathComponent = activePathComponents[_i];
        currentPath += path.sep + pathComponent;
        entry = this.entryForPath(currentPath);
        if (entry.hasClass('directory')) {
          _results.push(entry.expand());
        } else {
          centeringOffset = (this.scrollBottom() - this.scrollTop()) / 2;
          this.selectEntry(entry);
          _results.push(this.scrollToEntry(entry, centeringOffset));
        }
      }
      return _results;
    };

    TreeView.prototype.copySelectedEntryPath = function(relativePath) {
      var pathToCopy;
      if (relativePath == null) {
        relativePath = false;
      }
      if (pathToCopy = this.selectedPath) {
        if (relativePath) {
          pathToCopy = atom.project.relativize(pathToCopy);
        }
        return atom.clipboard.write(pathToCopy);
      }
    };

    TreeView.prototype.entryForPath = function(entryPath) {
      var fn;
      fn = function(bestMatchEntry, element) {
        var entry, _ref1;
        entry = $(element).view();
        if (entry.getPath() === entryPath) {
          return entry;
        } else if (entry.getPath().length > bestMatchEntry.getPath().length && ((_ref1 = entry.directory) != null ? _ref1.contains(entryPath) : void 0)) {
          return entry;
        } else {
          return bestMatchEntry;
        }
      };
      return this.list.find(".entry").toArray().reduce(fn, this.root);
    };

    TreeView.prototype.selectEntryForPath = function(entryPath) {
      return this.selectEntry(this.entryForPath(entryPath));
    };

    TreeView.prototype.moveDown = function() {
      var selectedEntry;
      selectedEntry = this.selectedEntry();
      if (selectedEntry) {
        if (selectedEntry.is('.expanded.directory')) {
          if (this.selectEntry(selectedEntry.find('.entry:first'))) {
            this.scrollToEntry(this.selectedEntry());
            return;
          }
        }
        while (!this.selectEntry(selectedEntry.next('.entry'))) {
          selectedEntry = selectedEntry.parents('.entry:first');
          if (!selectedEntry.length) {
            break;
          }
        }
      } else {
        this.selectEntry(this.root);
      }
      return this.scrollToEntry(this.selectedEntry());
    };

    TreeView.prototype.moveUp = function() {
      var previousEntry, selectedEntry;
      selectedEntry = this.selectedEntry();
      if (selectedEntry) {
        if (previousEntry = this.selectEntry(selectedEntry.prev('.entry'))) {
          if (previousEntry.is('.expanded.directory')) {
            this.selectEntry(previousEntry.find('.entry:last'));
          }
        } else {
          this.selectEntry(selectedEntry.parents('.directory').first());
        }
      } else {
        this.selectEntry(this.list.find('.entry').last());
      }
      return this.scrollToEntry(this.selectedEntry());
    };

    TreeView.prototype.expandDirectory = function(isRecursive) {
      var selectedEntry;
      if (isRecursive == null) {
        isRecursive = false;
      }
      selectedEntry = this.selectedEntry();
      if (selectedEntry instanceof DirectoryView) {
        return selectedEntry.view().expand(isRecursive);
      }
    };

    TreeView.prototype.collapseDirectory = function(isRecursive) {
      var directory, _ref1;
      if (isRecursive == null) {
        isRecursive = false;
      }
      if (directory = (_ref1 = this.selectedEntry()) != null ? _ref1.closest('.expanded.directory').view() : void 0) {
        directory.collapse(isRecursive);
        return this.selectEntry(directory);
      }
    };

    TreeView.prototype.openSelectedEntry = function(changeFocus) {
      var selectedEntry;
      selectedEntry = this.selectedEntry();
      if (selectedEntry instanceof DirectoryView) {
        return selectedEntry.view().toggleExpansion();
      } else if (selectedEntry instanceof FileView) {
        return atom.workspaceView.open(selectedEntry.getPath(), {
          changeFocus: changeFocus
        });
      }
    };

    TreeView.prototype.moveSelectedEntry = function() {
      var dialog, entry, oldPath;
      entry = this.selectedEntry();
      if (!(entry && entry !== this.root)) {
        return;
      }
      oldPath = entry.getPath();
      if (MoveDialog == null) {
        MoveDialog = require('./move-dialog');
      }
      dialog = new MoveDialog(oldPath);
      return dialog.attach();
    };

    TreeView.prototype.fileManagerCommandForPath = function(pathToOpen, isFile) {
      var args;
      switch (process.platform) {
        case 'darwin':
          return {
            command: 'open',
            label: 'Finder',
            args: ['-R', pathToOpen]
          };
        case 'win32':
          if (isFile) {
            args = ["/select," + pathToOpen];
          } else {
            args = ["/root," + pathToOpen];
          }
          return {
            command: 'explorer.exe',
            label: 'Explorer',
            args: args
          };
        default:
          if (isFile) {
            pathToOpen = path.dirname(pathToOpen);
          }
          return {
            command: 'xdg-open',
            label: 'File Manager',
            args: [pathToOpen]
          };
      }
    };

    TreeView.prototype.showSelectedEntryInFileManager = function() {
      var args, command, entry, errorLines, exit, isFile, label, stderr, _ref1;
      entry = this.selectedEntry();
      if (!entry) {
        return;
      }
      isFile = entry instanceof FileView;
      _ref1 = this.fileManagerCommandForPath(entry.getPath(), isFile), command = _ref1.command, args = _ref1.args, label = _ref1.label;
      errorLines = [];
      stderr = function(lines) {
        return errorLines.push(lines);
      };
      exit = function(code) {
        var error, failed;
        failed = code !== 0;
        error = errorLines.join('\n');
        if (process.platform === 'win32' && code === 1 && !error) {
          failed = false;
        }
        if (failed) {
          return atom.confirm({
            message: "Opening " + (isFile ? 'file' : 'folder') + " in " + label + " failed",
            detailedMessage: error,
            buttons: ['OK']
          });
        }
      };
      return new BufferedProcess({
        command: command,
        args: args,
        stderr: stderr,
        exit: exit
      });
    };

    TreeView.prototype.openSelectedEntryInNewWindow = function() {
      var pathToOpen, _ref1;
      if (pathToOpen = (_ref1 = this.selectedEntry()) != null ? _ref1.getPath() : void 0) {
        return atom.open({
          pathsToOpen: [pathToOpen],
          newWindow: true
        });
      }
    };

    TreeView.prototype.copySelectedEntry = function() {
      var dialog, entry, oldPath;
      if (this.hasFocus()) {
        entry = this.selectedEntry();
        if (entry === root) {
          return;
        }
        oldPath = entry.getPath();
      } else {
        oldPath = this.getActivePath();
      }
      if (!oldPath) {
        return;
      }
      if (CopyDialog == null) {
        CopyDialog = require('./copy-dialog');
      }
      dialog = new CopyDialog(oldPath);
      return dialog.attach();
    };

    TreeView.prototype.removeSelectedEntries = function() {
      var activePath, selectedPaths, _ref1;
      if (this.hasFocus()) {
        selectedPaths = this.selectedPaths();
      } else if (activePath = this.getActivePath()) {
        selectedPaths = [activePath];
      }
      if (!selectedPaths) {
        return;
      }
      if (_ref1 = this.root.getPath(), __indexOf.call(selectedPaths, _ref1) >= 0) {
        return atom.confirm({
          message: "The root directory '" + this.root.directory.name + "' can't be removed.",
          buttons: ['OK']
        });
      } else {
        return atom.confirm({
          message: "Are you sure you want to delete the selected " + (selectedPaths.length > 1 ? 'items' : 'item') + "?",
          detailedMessage: "You are deleting:\n" + (selectedPaths.join('\n')),
          buttons: {
            "Move to Trash": function() {
              var selectedPath, _i, _len, _results;
              _results = [];
              for (_i = 0, _len = selectedPaths.length; _i < _len; _i++) {
                selectedPath = selectedPaths[_i];
                _results.push(shell.moveItemToTrash(selectedPath));
              }
              return _results;
            },
            "Cancel": null
          }
        });
      }
    };

    TreeView.prototype.copySelectedEntries = function() {
      var selectedPaths;
      selectedPaths = this.selectedPaths();
      if (!(selectedPaths && selectedPaths.length > 0)) {
        return;
      }
      LocalStorage.removeItem('tree-view:cutPath');
      return LocalStorage['tree-view:copyPath'] = JSON.stringify(selectedPaths);
    };

    TreeView.prototype.cutSelectedEntries = function() {
      var selectedPaths;
      selectedPaths = this.selectedPaths();
      if (!(selectedPaths && selectedPaths.length > 0)) {
        return;
      }
      LocalStorage.removeItem('tree-view:copyPath');
      return LocalStorage['tree-view:cutPath'] = JSON.stringify(selectedPaths);
    };

    TreeView.prototype.pasteEntries = function() {
      var basePath, copiedPaths, cutPaths, entry, entryType, fileArr, fileCounter, initialPath, initialPathIsDirectory, initialPaths, newPath, originalNewPath, _i, _len, _ref1, _results;
      entry = this.selectedEntry();
      cutPaths = LocalStorage['tree-view:cutPath'] ? JSON.parse(LocalStorage['tree-view:cutPath']) : null;
      copiedPaths = LocalStorage['tree-view:copyPath'] ? JSON.parse(LocalStorage['tree-view:copyPath']) : null;
      initialPaths = copiedPaths || cutPaths;
      _ref1 = initialPaths != null ? initialPaths : [];
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        initialPath = _ref1[_i];
        initialPathIsDirectory = fs.isDirectorySync(initialPath);
        if (entry && initialPath) {
          basePath = atom.project.resolve(entry.getPath());
          entryType = entry instanceof DirectoryView ? "directory" : "file";
          if (entryType === 'file') {
            basePath = path.dirname(basePath);
          }
          newPath = path.join(basePath, path.basename(initialPath));
          if (copiedPaths) {
            fileCounter = 0;
            originalNewPath = newPath;
            while (fs.existsSync(newPath)) {
              if (initialPathIsDirectory) {
                newPath = "" + originalNewPath + (fileCounter.toString());
              } else {
                fileArr = originalNewPath.split('.');
                newPath = "" + fileArr[0] + (fileCounter.toString()) + "." + fileArr[1];
              }
              fileCounter += 1;
            }
            if (fs.isDirectorySync(initialPath)) {
              _results.push(fs.copySync(initialPath, newPath));
            } else {
              _results.push(fs.writeFileSync(newPath, fs.readFileSync(initialPath)));
            }
          } else if (cutPaths) {
            if (!(fs.existsSync(newPath) || !!newPath.match(new RegExp("^" + initialPath)))) {
              _results.push(fs.moveSync(initialPath, newPath));
            } else {
              _results.push(void 0);
            }
          } else {
            _results.push(void 0);
          }
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    TreeView.prototype.add = function(isCreatingFile) {
      var dialog, selectedEntry, selectedPath;
      selectedEntry = this.selectedEntry() || this.root;
      selectedPath = selectedEntry.getPath();
      if (AddDialog == null) {
        AddDialog = require('./add-dialog');
      }
      dialog = new AddDialog(selectedPath, isCreatingFile);
      dialog.on('directory-created', (function(_this) {
        return function(event, createdPath) {
          _this.entryForPath(createdPath).reload();
          _this.selectEntryForPath(createdPath);
          return false;
        };
      })(this));
      dialog.on('file-created', function(event, createdPath) {
        atom.workspace.open(createdPath);
        return false;
      });
      return dialog.attach();
    };

    TreeView.prototype.selectedEntry = function() {
      var _ref1;
      return (_ref1 = this.list.find('.selected')) != null ? _ref1.view() : void 0;
    };

    TreeView.prototype.selectEntry = function(entry) {
      entry = entry != null ? entry.view() : void 0;
      if (entry == null) {
        return false;
      }
      this.selectedPath = entry.getPath();
      this.deselect();
      return entry.addClass('selected');
    };

    TreeView.prototype.deselect = function() {
      return this.list.find('.selected').removeClass('selected');
    };

    TreeView.prototype.scrollTop = function(top) {
      if (top != null) {
        return this.scroller.scrollTop(top);
      } else {
        return this.scroller.scrollTop();
      }
    };

    TreeView.prototype.scrollBottom = function(bottom) {
      if (bottom != null) {
        return this.scroller.scrollBottom(bottom);
      } else {
        return this.scroller.scrollBottom();
      }
    };

    TreeView.prototype.scrollToEntry = function(entry, offset) {
      var bottom, displayElement, top;
      if (offset == null) {
        offset = 0;
      }
      displayElement = entry instanceof DirectoryView ? entry.header : entry;
      top = displayElement.position().top;
      bottom = top + displayElement.outerHeight();
      if (bottom > this.scrollBottom()) {
        this.scrollBottom(bottom + offset);
      }
      if (top < this.scrollTop()) {
        return this.scrollTop(top + offset);
      }
    };

    TreeView.prototype.scrollToBottom = function() {
      var lastEntry, _ref1;
      if (lastEntry = (_ref1 = this.root) != null ? _ref1.find('.entry:last').view() : void 0) {
        this.selectEntry(lastEntry);
        return this.scrollToEntry(lastEntry);
      }
    };

    TreeView.prototype.scrollToTop = function() {
      if (this.root != null) {
        this.selectEntry(this.root);
      }
      return this.scrollTop(0);
    };

    TreeView.prototype.toggleSide = function() {
      return atom.config.toggle('tree-view.showOnRightSide');
    };

    TreeView.prototype.onSideToggled = function(newValue) {
      this.detach();
      this.attach();
      return this.attr('data-show-on-right-side', newValue);
    };

    TreeView.prototype.selectedPaths = function() {
      var item, _i, _len, _ref1, _results;
      _ref1 = this.list.find('.selected');
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        item = _ref1[_i];
        _results.push($(item).view().getPath());
      }
      return _results;
    };

    TreeView.prototype.selectContinuousEntries = function(entry) {
      var currentSelectedEntry, element, elements, entryIndex, i, parentContainer, selectedIndex, _i, _len;
      currentSelectedEntry = this.selectedEntry();
      parentContainer = entry.parent();
      if ($.contains(parentContainer[0], currentSelectedEntry[0])) {
        entryIndex = parentContainer.indexOf(entry);
        selectedIndex = parentContainer.indexOf(currentSelectedEntry);
        elements = (function() {
          var _i, _results;
          _results = [];
          for (i = _i = entryIndex; entryIndex <= selectedIndex ? _i <= selectedIndex : _i >= selectedIndex; i = entryIndex <= selectedIndex ? ++_i : --_i) {
            _results.push(parentContainer.children()[i]);
          }
          return _results;
        })();
        this.deselect();
        for (_i = 0, _len = elements.length; _i < _len; _i++) {
          element = elements[_i];
          $(element).addClass('selected');
        }
      }
      return elements;
    };

    TreeView.prototype.selectMultipleEntries = function(entry) {
      entry = entry != null ? entry.view() : void 0;
      if (entry == null) {
        return false;
      }
      entry.addClass('selected');
      return entry;
    };

    TreeView.prototype.showFullMenu = function() {
      return this.list.removeClass('multi-select').addClass('full-menu');
    };

    TreeView.prototype.showMultiSelectMenu = function() {
      return this.list.removeClass('full-menu').addClass('multi-select');
    };

    TreeView.prototype.multiSelectEnabled = function() {
      return this.list.hasClass('multi-select');
    };

    return TreeView;

  })(ScrollView);

}).call(this);
