(function() {
  var $, $$, TreeView, WorkspaceView, fs, os, path, temp, waitsForFileToOpen, wrench, _, _ref;

  _ = require('underscore-plus');

  _ref = require('atom'), $ = _ref.$, $$ = _ref.$$, WorkspaceView = _ref.WorkspaceView;

  fs = require('fs-plus');

  TreeView = require('../lib/tree-view');

  path = require('path');

  temp = require('temp').track();

  wrench = require('wrench');

  os = require('os');

  waitsForFileToOpen = function(fn) {
    var openHandler;
    openHandler = jasmine.createSpy();
    runs(function() {
      atom.workspaceView.one("uri-opened", openHandler);
      return fn();
    });
    return waitsFor(function() {
      return openHandler.callCount === 1;
    });
  };

  describe("TreeView", function() {
    var sampleJs, sampleTxt, treeView, _ref1;
    _ref1 = [], treeView = _ref1[0], sampleJs = _ref1[1], sampleTxt = _ref1[2];
    beforeEach(function() {
      var fixturesPath, tempPath;
      tempPath = fs.realpathSync(temp.mkdirSync('atom'));
      fixturesPath = atom.project.getPath();
      wrench.copyDirSyncRecursive(fixturesPath, tempPath, {
        forceDelete: true
      });
      atom.project.setPath(path.join(tempPath, 'tree-view'));
      atom.workspaceView = new WorkspaceView;
      waitsForPromise(function() {
        return atom.packages.activatePackage("tree-view");
      });
      return runs(function() {
        atom.workspaceView.trigger('tree-view:toggle');
        treeView = atom.workspaceView.find(".tree-view").view();
        treeView.root = treeView.find('ol > li:first').view();
        sampleJs = treeView.find('.file:contains(tree-view.js)');
        sampleTxt = treeView.find('.file:contains(tree-view.txt)');
        return expect(treeView.root.directory.getSubscriptionCount()).toBeGreaterThan(0);
      });
    });
    afterEach(function() {
      return temp.cleanup();
    });
    describe(".initialize(project)", function() {
      it("renders the root of the project and its contents alphabetically with subdirectories first in a collapsed state", function() {
        var rootEntries, subdir0, subdir2;
        expect(treeView.root.find('> .header .disclosure-arrow')).not.toHaveClass('expanded');
        expect(treeView.root.find('> .header .name')).toHaveText('tree-view');
        rootEntries = treeView.root.find('.entries');
        subdir0 = rootEntries.find('> li:eq(0)');
        expect(subdir0).not.toHaveClass('expanded');
        expect(subdir0.find('.name')).toHaveText('dir1');
        subdir2 = rootEntries.find('> li:eq(1)');
        expect(subdir2).not.toHaveClass('expanded');
        expect(subdir2.find('.name')).toHaveText('dir2');
        expect(subdir0.find('[data-name="dir1"]')).toExist();
        expect(subdir2.find('[data-name="dir2"]')).toExist();
        expect(rootEntries.find('> .file:contains(tree-view.js)')).toExist();
        expect(rootEntries.find('> .file:contains(tree-view.txt)')).toExist();
        expect(rootEntries.find('> .file [data-name="tree-view.js"]')).toExist();
        return expect(rootEntries.find('> .file [data-name="tree-view.txt"]')).toExist();
      });
      it("selects the rootview", function() {
        return expect(treeView.selectedEntry()).toEqual(treeView.root);
      });
      describe("when the project has no path", function() {
        beforeEach(function() {
          atom.project.setPath(void 0);
          atom.packages.deactivatePackage("tree-view");
          waitsForPromise(function() {
            return atom.packages.activatePackage("tree-view");
          });
          return runs(function() {
            return treeView = atom.packages.getActivePackage("tree-view").mainModule.createView();
          });
        });
        it("does not attach to the root view or create a root node when initialized", function() {
          expect(treeView.hasParent()).toBeFalsy();
          return expect(treeView.root).not.toExist();
        });
        it("does not attach to the root view or create a root node when attach() is called", function() {
          treeView.attach();
          expect(treeView.hasParent()).toBeFalsy();
          return expect(treeView.root).not.toExist();
        });
        it("serializes without throwing an exception", function() {
          return expect(function() {
            return treeView.serialize();
          }).not.toThrow();
        });
        it("does not throw an exception when files are opened", function() {
          var filePath;
          filePath = path.join(os.tmpdir(), 'non-project-file.txt');
          fs.writeFileSync(filePath, 'test');
          return waitsForPromise(function() {
            return atom.workspace.open(filePath);
          });
        });
        it("does not reveal the active file", function() {
          var filePath;
          filePath = path.join(os.tmpdir(), 'non-project-file.txt');
          fs.writeFileSync(filePath, 'test');
          waitsForPromise(function() {
            return atom.workspace.open(filePath);
          });
          return runs(function() {
            atom.workspaceView.trigger('tree-view:reveal-active-file');
            expect(treeView.hasParent()).toBeFalsy();
            return expect(treeView.root).not.toExist();
          });
        });
        return describe("when the project is assigned a path because a new buffer is saved", function() {
          return it("creates a root directory view but does not attach to the root view", function() {
            waitsForPromise(function() {
              return atom.workspaceView.open();
            });
            return runs(function() {
              var projectPath;
              projectPath = temp.mkdirSync('atom-project');
              atom.workspace.getActivePaneItem().saveAs(path.join(projectPath, 'test.txt'));
              expect(treeView.hasParent()).toBeFalsy();
              expect(fs.absolute(treeView.root.getPath())).toBe(fs.absolute(projectPath));
              return expect(treeView.root.parent()).toMatchSelector(".tree-view");
            });
          });
        });
      });
      describe("when the root view is opened to a file path", function() {
        return it("does not attach to the root view but does create a root node when initialized", function() {
          atom.packages.deactivatePackage("tree-view");
          atom.packages.packageStates = {};
          waitsForPromise(function() {
            return atom.workspace.open('tree-view.js');
          });
          waitsForPromise(function() {
            return atom.packages.activatePackage('tree-view');
          });
          return runs(function() {
            treeView = atom.packages.getActivePackage("tree-view").mainModule.createView();
            expect(treeView.hasParent()).toBeFalsy();
            return expect(treeView.root).toExist();
          });
        });
      });
      describe("when the root view is opened to a directory", function() {
        return it("attaches to the root view", function() {
          waitsForPromise(function() {
            return atom.packages.activatePackage('tree-view');
          });
          return runs(function() {
            treeView = atom.packages.getActivePackage("tree-view").mainModule.createView();
            expect(treeView.hasParent()).toBeTruthy();
            return expect(treeView.root).toExist();
          });
        });
      });
      return describe("when the project is a .git folder", function() {
        return it("does not create the tree view", function() {
          var dotGit;
          dotGit = path.join(temp.mkdirSync('repo'), '.git');
          fs.makeTreeSync(dotGit);
          atom.project.setPath(dotGit);
          atom.packages.deactivatePackage("tree-view");
          atom.packages.packageStates = {};
          waitsForPromise(function() {
            return atom.packages.activatePackage('tree-view');
          });
          return runs(function() {
            treeView = atom.packages.getActivePackage("tree-view").mainModule.treeView;
            return expect(treeView).toBeFalsy();
          });
        });
      });
    });
    describe("serialization", function() {
      it("restores expanded directories and selected file when deserialized", function() {
        treeView.root.find('.directory:contains(dir1)').view().click();
        waitsForFileToOpen(function() {
          return sampleJs.click();
        });
        runs(function() {
          return atom.packages.deactivatePackage("tree-view");
        });
        waitsForPromise(function() {
          return atom.packages.activatePackage("tree-view");
        });
        return runs(function() {
          treeView = atom.workspaceView.find(".tree-view").view();
          expect(treeView).toExist();
          expect(treeView.selectedEntry()).toMatchSelector(".file:contains(tree-view.js)");
          return expect(treeView.find(".directory:contains(dir1)")).toHaveClass("expanded");
        });
      });
      it("restores the focus state of the tree view", function() {
        atom.workspaceView.attachToDom();
        treeView.focus();
        expect(treeView.list).toMatchSelector(':focus');
        atom.packages.deactivatePackage("tree-view");
        waitsForPromise(function() {
          return atom.packages.activatePackage("tree-view");
        });
        return runs(function() {
          treeView = atom.workspaceView.find(".tree-view").view();
          return expect(treeView.list).toMatchSelector(':focus');
        });
      });
      it("restores the scroll top when toggled", function() {
        atom.workspaceView.height(5);
        atom.workspaceView.attachToDom();
        expect(treeView).toBeVisible();
        treeView.focus();
        treeView.scrollTop(10);
        expect(treeView.scrollTop()).toBe(10);
        runs(function() {
          return atom.workspaceView.trigger('tree-view:toggle');
        });
        waitsFor(function() {
          return treeView.is(':hidden');
        });
        runs(function() {
          return atom.workspaceView.trigger('tree-view:toggle');
        });
        waitsFor(function() {
          return treeView.is(':visible');
        });
        return runs(function() {
          return expect(treeView.scrollTop()).toBe(10);
        });
      });
      return it("restores the scroll left when toggled", function() {
        atom.workspaceView.width(5);
        atom.workspaceView.attachToDom();
        expect(treeView).toBeVisible();
        treeView.focus();
        treeView.scroller.scrollLeft(5);
        expect(treeView.scroller.scrollLeft()).toBe(5);
        runs(function() {
          return atom.workspaceView.trigger('tree-view:toggle');
        });
        waitsFor(function() {
          return treeView.is(':hidden');
        });
        runs(function() {
          return atom.workspaceView.trigger('tree-view:toggle');
        });
        waitsFor(function() {
          return treeView.is(':visible');
        });
        return runs(function() {
          return expect(treeView.scroller.scrollLeft()).toBe(5);
        });
      });
    });
    describe("when tree-view:toggle is triggered on the root view", function() {
      beforeEach(function() {
        return atom.workspaceView.attachToDom();
      });
      describe("when the tree view is visible", function() {
        beforeEach(function() {
          return expect(treeView).toBeVisible();
        });
        describe("when the tree view is focused", function() {
          return it("hides the tree view", function() {
            treeView.focus();
            atom.workspaceView.trigger('tree-view:toggle');
            return expect(treeView).toBeHidden();
          });
        });
        return describe("when the tree view is not focused", function() {
          return it("hides the tree view", function() {
            treeView.focus();
            atom.workspaceView.trigger('tree-view:toggle');
            return expect(treeView).toBeHidden();
          });
        });
      });
      describe("when the tree view is hidden", function() {
        return it("shows and focuses the tree view", function() {
          treeView.detach();
          atom.workspaceView.trigger('tree-view:toggle');
          expect(treeView.hasParent()).toBeTruthy();
          return expect(treeView.list).toMatchSelector(':focus');
        });
      });
      return describe("when tree-view:toggle-side is triggered on the root view", function() {
        beforeEach(function() {
          return atom.workspaceView.attachToDom();
        });
        describe("when the tree view is on the left", function() {
          return it("should be moved to the right", function() {
            expect(treeView).toBeVisible();
            atom.workspaceView.trigger('tree-view:toggle-side');
            return expect(treeView).toMatchSelector('[data-show-on-right-side="true"]');
          });
        });
        return describe("when the tree view is on the right", function() {
          beforeEach(function() {
            return atom.workspaceView.trigger('tree-view:toggle-side');
          });
          return it("should be moved to the left", function() {
            expect(treeView).toBeVisible();
            atom.workspaceView.trigger('tree-view:toggle-side');
            return expect(treeView).toMatchSelector('[data-show-on-right-side="false"]');
          });
        });
      });
    });
    describe("when tree-view:toggle-focus is triggered on the root view", function() {
      beforeEach(function() {
        return atom.workspaceView.attachToDom();
      });
      describe("when the tree view is hidden", function() {
        return it("shows and focuses the tree view", function() {
          treeView.detach();
          atom.workspaceView.trigger('tree-view:toggle-focus');
          expect(treeView.hasParent()).toBeTruthy();
          return expect(treeView.list).toMatchSelector(':focus');
        });
      });
      return describe("when the tree view is shown", function() {
        it("focuses the tree view", function() {
          waitsForPromise(function() {
            return atom.workspace.open();
          });
          return runs(function() {
            atom.workspaceView.focus();
            expect(treeView).toBeVisible();
            atom.workspaceView.trigger('tree-view:toggle-focus');
            expect(treeView).toBeVisible();
            return expect(treeView.list).toMatchSelector(':focus');
          });
        });
        return describe("when the tree view is focused", function() {
          return it("unfocuses the tree view", function() {
            waitsForPromise(function() {
              return atom.workspace.open();
            });
            return runs(function() {
              treeView.focus();
              expect(treeView).toBeVisible();
              atom.workspaceView.trigger('tree-view:toggle-focus');
              expect(treeView).toBeVisible();
              return expect(treeView.list).not.toMatchSelector(':focus');
            });
          });
        });
      });
    });
    describe("when tree-view:reveal-current-file is triggered on the root view", function() {
      beforeEach(function() {
        treeView.detach();
        return spyOn(treeView, 'focus');
      });
      describe("if the current file has a path", function() {
        return it("shows and focuses the tree view and selects the file", function() {
          waitsForPromise(function() {
            return atom.workspace.open(path.join('dir1', 'file1'));
          });
          return runs(function() {
            atom.workspaceView.trigger('tree-view:reveal-active-file');
            expect(treeView.hasParent()).toBeTruthy();
            expect(treeView.focus).toHaveBeenCalled();
            return expect(treeView.selectedEntry().getPath()).toMatch(new RegExp("dir1" + (_.escapeRegExp(path.sep)) + "file1$"));
          });
        });
      });
      describe("if the current file has no path", function() {
        return it("shows and focuses the tree view, but does not attempt to select a specific file", function() {
          waitsForPromise(function() {
            return atom.workspace.open();
          });
          return runs(function() {
            expect(atom.workspace.getActivePaneItem().getPath()).toBeUndefined();
            atom.workspaceView.trigger('tree-view:reveal-active-file');
            expect(treeView.hasParent()).toBeTruthy();
            return expect(treeView.focus).toHaveBeenCalled();
          });
        });
      });
      return describe("if there is no editor open", function() {
        return it("shows and focuses the tree view, but does not attempt to select a specific file", function() {
          expect(atom.workspace.getActivePaneItem()).toBeUndefined();
          atom.workspaceView.trigger('tree-view:reveal-active-file');
          expect(treeView.hasParent()).toBeTruthy();
          return expect(treeView.focus).toHaveBeenCalled();
        });
      });
    });
    describe("when tool-panel:unfocus is triggered on the tree view", function() {
      return it("surrenders focus to the root view but remains open", function() {
        waitsForPromise(function() {
          return atom.workspace.open();
        });
        return runs(function() {
          atom.workspaceView.attachToDom();
          treeView.focus();
          expect(treeView.list).toMatchSelector(':focus');
          treeView.trigger('tool-panel:unfocus');
          expect(treeView).toBeVisible();
          expect(treeView.list).not.toMatchSelector(':focus');
          return expect(atom.workspaceView.getActiveView().isFocused).toBeTruthy();
        });
      });
    });
    describe("copy path commands", function() {
      var pathToSelect, relativizedPath, _ref2;
      _ref2 = [], pathToSelect = _ref2[0], relativizedPath = _ref2[1];
      beforeEach(function() {
        pathToSelect = path.join(treeView.root.directory.path, 'dir1', 'file1');
        relativizedPath = atom.project.relativize(pathToSelect);
        return spyOn(atom.clipboard, 'write');
      });
      describe("when tree-view:copy-full-path is triggered on the tree view", function() {
        it("copies the selected path to the clipboard", function() {
          treeView.selectedPath = pathToSelect;
          treeView.trigger('tree-view:copy-full-path');
          return expect(atom.clipboard.write).toHaveBeenCalledWith(pathToSelect);
        });
        return describe("when there is no selected path", function() {
          beforeEach(function() {
            return treeView.selectedPath = null;
          });
          return it("does nothing", function() {
            treeView.trigger('tree-view:copy-full-path');
            return expect(atom.clipboard.write).not.toHaveBeenCalled();
          });
        });
      });
      return describe("when tree-view:copy-project-path is triggered on the tree view", function() {
        it("copies the relativized selected path to the clipboard", function() {
          treeView.selectedPath = pathToSelect;
          treeView.trigger('tree-view:copy-project-path');
          return expect(atom.clipboard.write).toHaveBeenCalledWith(relativizedPath);
        });
        return describe("when there is no selected path", function() {
          beforeEach(function() {
            return treeView.selectedPath = null;
          });
          return it("does nothing", function() {
            treeView.trigger('tree-view:copy-project-path');
            return expect(atom.clipboard.write).not.toHaveBeenCalled();
          });
        });
      });
    });
    describe("when a directory's disclosure arrow is clicked", function() {
      it("expands / collapses the associated directory", function() {
        var subdir;
        subdir = treeView.root.find('.entries > li:contains(dir1)').view();
        expect(subdir).not.toHaveClass('expanded');
        subdir.click();
        expect(subdir).toHaveClass('expanded');
        subdir.click();
        return expect(subdir).not.toHaveClass('expanded');
      });
      it("restores the expansion state of descendant directories", function() {
        var child, grandchild;
        child = treeView.root.find('.entries > li:contains(dir1)').view();
        child.click();
        grandchild = child.find('.entries > li:contains(sub-dir1)').view();
        grandchild.click();
        treeView.root.click();
        expect(treeView.root).not.toHaveClass('expanded');
        treeView.root.click();
        expect(treeView.root.find('> .entries > li:contains(dir1) > .entries > li:contains(sub-dir1) > .entries').length).toBe(1);
        return expect(treeView.root.find('> .entries > li:contains(dir2) > .entries')).not.toHaveClass('expanded');
      });
      return it("when collapsing a directory, removes change subscriptions from the collapsed directory and its descendants", function() {
        var child, grandchild;
        child = treeView.root.entries.find('li:contains(dir1)').view();
        child.click();
        grandchild = child.entries.find('li:contains(sub-dir1)').view();
        grandchild.click();
        expect(treeView.root.directory.directory.getSubscriptionCount('contents-changed')).toBe(1);
        expect(child.directory.directory.getSubscriptionCount('contents-changed')).toBe(1);
        expect(grandchild.directory.directory.getSubscriptionCount('contents-changed')).toBe(1);
        treeView.root.click();
        expect(treeView.root.directory.directory.getSubscriptionCount('contents-changed')).toBe(0);
        expect(child.directory.directory.getSubscriptionCount('contents-changed')).toBe(0);
        return expect(grandchild.directory.directory.getSubscriptionCount('contents-changed')).toBe(0);
      });
    });
    describe("when mouse down fires on a file or directory", function() {
      return it("selects the entry", function() {
        var dir;
        dir = treeView.root.entries.find('li:contains(dir1)').view();
        expect(dir).not.toHaveClass('selected');
        dir.mousedown();
        expect(dir).toHaveClass('selected');
        expect(sampleJs).not.toHaveClass('selected');
        sampleJs.mousedown();
        return expect(sampleJs).toHaveClass('selected');
      });
    });
    describe("when a file is single-clicked", function() {
      return it("selects the files and opens it in the active editor, without changing focus", function() {
        expect(atom.workspaceView.getActiveView()).toBeUndefined();
        waitsForFileToOpen(function() {
          return sampleJs.trigger(clickEvent({
            originalEvent: {
              detail: 1
            }
          }));
        });
        runs(function() {
          expect(sampleJs).toHaveClass('selected');
          expect(atom.workspace.getActivePaneItem().getPath()).toBe(atom.project.resolve('tree-view.js'));
          return expect(atom.workspaceView.getActiveView().isFocused).toBeFalsy();
        });
        waitsForFileToOpen(function() {
          return sampleTxt.trigger(clickEvent({
            originalEvent: {
              detail: 1
            }
          }));
        });
        return runs(function() {
          expect(sampleTxt).toHaveClass('selected');
          expect(treeView.find('.selected').length).toBe(1);
          expect(atom.workspace.getActivePaneItem().getPath()).toBe(atom.project.resolve('tree-view.txt'));
          return expect(atom.workspaceView.getActiveView().isFocused).toBeFalsy();
        });
      });
    });
    describe("when a file is double-clicked", function() {
      beforeEach(function() {
        return atom.workspaceView.attachToDom();
      });
      return it("selects the file and opens it in the active editor on the first click, then changes focus to the active editor on the second", function() {
        runs(function() {
          return treeView.focus();
        });
        waitsForFileToOpen(function() {
          return sampleJs.trigger(clickEvent({
            originalEvent: {
              detail: 1
            }
          }));
        });
        return runs(function() {
          expect(sampleJs).toHaveClass('selected');
          expect(atom.workspace.getActivePaneItem().getPath()).toBe(atom.project.resolve('tree-view.js'));
          expect(atom.workspaceView.getActiveView().isFocused).toBeFalsy();
          sampleJs.trigger(clickEvent({
            originalEvent: {
              detail: 2
            }
          }));
          return expect(atom.workspaceView.getActiveView().isFocused).toBeTruthy();
        });
      });
    });
    describe("when a directory is single-clicked", function() {
      return it("is selected", function() {
        var subdir;
        subdir = treeView.root.find('.directory:first').view();
        subdir.trigger(clickEvent({
          originalEvent: {
            detail: 1
          }
        }));
        return expect(subdir).toHaveClass('selected');
      });
    });
    describe("when a directory is double-clicked", function() {
      return it("toggles the directory expansion state and does not change the focus to the editor", function() {
        var subdir;
        subdir = null;
        waitsForFileToOpen(function() {
          return sampleJs.trigger(clickEvent({
            originalEvent: {
              detail: 1
            }
          }));
        });
        return runs(function() {
          subdir = treeView.root.find('.directory:first').view();
          subdir.trigger(clickEvent({
            originalEvent: {
              detail: 1
            }
          }));
          expect(subdir).toHaveClass('selected');
          expect(subdir).toHaveClass('expanded');
          subdir.trigger(clickEvent({
            originalEvent: {
              detail: 2
            }
          }));
          expect(subdir).toHaveClass('selected');
          expect(subdir).not.toHaveClass('expanded');
          return expect(atom.workspaceView.getActiveView().isFocused).toBeFalsy();
        });
      });
    });
    describe("when an directory is alt-clicked", function() {
      describe("when the directory is collapsed", function() {
        return it("recursively expands the directory", function() {
          var children;
          treeView.root.click();
          treeView.root.collapse();
          expect(treeView.root).not.toHaveClass('expanded');
          treeView.root.trigger(clickEvent({
            altKey: true
          }));
          expect(treeView.root).toHaveClass('expanded');
          children = treeView.root.find('.directory');
          expect(children.length).toBeGreaterThan(0);
          return children.each(function(index, child) {
            var childView;
            childView = $(child).view();
            return expect(childView).toHaveClass('expanded');
          });
        });
      });
      return describe("when the directory is expanded", function() {
        var children, parent;
        parent = null;
        children = null;
        beforeEach(function() {
          parent = treeView.root.find('> .entries > .directory').eq(2).view();
          parent.expand();
          children = parent.find('.expanded.directory');
          return children.each(function(index, child) {
            return $(child).view().expand();
          });
        });
        return it("recursively collapses the directory", function() {
          parent.click().expand();
          expect(parent).toHaveClass('expanded');
          children.each(function(index, child) {
            $(child).view().click().expand();
            return expect($(child).view()).toHaveClass('expanded');
          });
          parent.trigger(clickEvent({
            altKey: true
          }));
          expect(parent).not.toHaveClass('expanded');
          children.each(function(index, child) {
            return expect($(child).view()).not.toHaveClass('expanded');
          });
          return expect(treeView.root).toHaveClass('expanded');
        });
      });
    });
    describe("when the active item changes on the active pane", function() {
      describe("when the item has a path", function() {
        it("selects the entry with that path in the tree view if it is visible", function() {
          waitsForFileToOpen(function() {
            return sampleJs.click();
          });
          waitsForPromise(function() {
            return atom.workspace.open(atom.project.resolve('tree-view.txt'));
          });
          return runs(function() {
            expect(sampleTxt).toHaveClass('selected');
            return expect(treeView.find('.selected').length).toBe(1);
          });
        });
        return it("selects the path's parent dir if its entry is not visible", function() {
          waitsForPromise(function() {
            return atom.workspace.open('dir1/sub-dir1/sub-file1');
          });
          return runs(function() {
            var dirView;
            dirView = treeView.root.find('.directory:contains(dir1)').view();
            return expect(dirView).toHaveClass('selected');
          });
        });
      });
      return describe("when the item has no path", function() {
        return it("deselects the previously selected entry", function() {
          waitsForFileToOpen(function() {
            return sampleJs.click();
          });
          return runs(function() {
            atom.workspaceView.getActivePaneView().activateItem($$(function() {
              return this.div('hello');
            }));
            return expect(atom.workspaceView.find('.selected')).not.toExist();
          });
        });
      });
    });
    describe("when a different editor becomes active", function() {
      beforeEach(function() {
        return atom.workspaceView.attachToDom();
      });
      return it("selects the file in that is open in that editor", function() {
        var leftEditorView, rightEditorView;
        leftEditorView = null;
        rightEditorView = null;
        waitsForFileToOpen(function() {
          return sampleJs.click();
        });
        runs(function() {
          leftEditorView = atom.workspaceView.getActiveView();
          return rightEditorView = leftEditorView.splitRight();
        });
        waitsForFileToOpen(function() {
          return sampleTxt.click();
        });
        return runs(function() {
          expect(sampleTxt).toHaveClass('selected');
          leftEditorView.focus();
          return expect(sampleJs).toHaveClass('selected');
        });
      });
    });
    describe("keyboard navigation", function() {
      afterEach(function() {
        return expect(treeView.find('.selected').length).toBeLessThan(2);
      });
      describe("core:move-down", function() {
        describe("when a collapsed directory is selected", function() {
          return it("skips to the next directory", function() {
            treeView.root.find('.directory:eq(0)').click();
            treeView.trigger('core:move-down');
            return expect(treeView.root.find('.directory:eq(1)')).toHaveClass('selected');
          });
        });
        describe("when an expanded directory is selected", function() {
          return it("selects the first entry of the directory", function() {
            var subdir;
            subdir = treeView.root.find('.directory:eq(1)').view();
            subdir.click();
            treeView.trigger('core:move-down');
            return expect(subdir.entries.find('.entry:first')).toHaveClass('selected');
          });
        });
        describe("when the last entry of an expanded directory is selected", function() {
          return it("selects the entry after its parent directory", function() {
            var subdir1;
            subdir1 = treeView.root.find('.directory:eq(1)').view();
            subdir1.expand();
            waitsForFileToOpen(function() {
              return subdir1.entries.find('.entry:last').click();
            });
            return runs(function() {
              treeView.trigger('core:move-down');
              return expect(treeView.root.find('.directory:eq(2)')).toHaveClass('selected');
            });
          });
        });
        describe("when the last directory of another last directory is selected", function() {
          var nested, nested2, _ref2;
          _ref2 = [], nested = _ref2[0], nested2 = _ref2[1];
          beforeEach(function() {
            nested = treeView.root.find('.directory:eq(2)').view();
            expect(nested.find('.header').text()).toContain('nested');
            nested.expand();
            nested2 = nested.entries.find('.entry:last').view();
            nested2.click();
            return nested2.collapse();
          });
          describe("when the directory is collapsed", function() {
            return it("selects the entry after its grandparent directory", function() {
              treeView.trigger('core:move-down');
              return expect(nested.next()).toHaveClass('selected');
            });
          });
          return describe("when the directory is expanded", function() {
            return it("selects the entry after its grandparent directory", function() {
              nested2.expand();
              nested2.find('.file').remove();
              treeView.trigger('core:move-down');
              return expect(nested.next()).toHaveClass('selected');
            });
          });
        });
        return describe("when the last entry of the last directory is selected", function() {
          return it("does not change the selection", function() {
            var lastEntry;
            lastEntry = treeView.root.find('> .entries .entry:last');
            waitsForFileToOpen(function() {
              return lastEntry.click();
            });
            return runs(function() {
              treeView.trigger('core:move-down');
              return expect(lastEntry).toHaveClass('selected');
            });
          });
        });
      });
      describe("core:move-up", function() {
        describe("when there is an expanded directory before the currently selected entry", function() {
          return it("selects the last entry in the expanded directory", function() {
            var fileAfterDir, lastDir;
            lastDir = treeView.root.find('.directory:last').view();
            fileAfterDir = lastDir.next().view();
            lastDir.expand();
            waitsForFileToOpen(function() {
              return fileAfterDir.click();
            });
            return runs(function() {
              treeView.trigger('core:move-up');
              return expect(lastDir.find('.entry:last')).toHaveClass('selected');
            });
          });
        });
        describe("when there is an entry before the currently selected entry", function() {
          return it("selects the previous entry", function() {
            var lastEntry;
            lastEntry = treeView.root.find('.entry:last');
            waitsForFileToOpen(function() {
              return lastEntry.click();
            });
            return runs(function() {
              treeView.trigger('core:move-up');
              return expect(lastEntry.prev()).toHaveClass('selected');
            });
          });
        });
        describe("when there is no entry before the currently selected entry, but there is a parent directory", function() {
          return it("selects the parent directory", function() {
            var subdir;
            subdir = treeView.root.find('.directory:first').view();
            subdir.expand();
            subdir.find('> .entries > .entry:first').click();
            treeView.trigger('core:move-up');
            return expect(subdir).toHaveClass('selected');
          });
        });
        return describe("when there is no parent directory or previous entry", function() {
          return it("does not change the selection", function() {
            treeView.root.click();
            treeView.trigger('core:move-up');
            return expect(treeView.root).toHaveClass('selected');
          });
        });
      });
      describe("core:move-to-top", function() {
        it("scrolls to the top", function() {
          var element, entryCount, _i, _len, _ref2;
          treeView.height(100);
          treeView.attachToDom();
          _ref2 = treeView.find('.directory');
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            element = _ref2[_i];
            $(element).view().expand();
          }
          expect(treeView.list.outerHeight()).toBeGreaterThan(treeView.scroller.outerHeight());
          expect(treeView.scrollTop()).toBe(0);
          entryCount = treeView.find(".entry").length;
          _.times(entryCount, function() {
            return treeView.moveDown();
          });
          expect(treeView.scrollTop()).toBeGreaterThan(0);
          treeView.trigger('core:move-to-top');
          return expect(treeView.scrollTop()).toBe(0);
        });
        return it("selects the root entry", function() {
          var entryCount;
          entryCount = treeView.find(".entry").length;
          _.times(entryCount, function() {
            return treeView.moveDown();
          });
          expect(treeView.root).not.toHaveClass('selected');
          treeView.trigger('core:move-to-top');
          return expect(treeView.root).toHaveClass('selected');
        });
      });
      describe("core:move-to-bottom", function() {
        it("scrolls to the bottom", function() {
          var element, _i, _len, _ref2;
          treeView.height(100);
          treeView.attachToDom();
          _ref2 = treeView.find('.directory');
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            element = _ref2[_i];
            $(element).view().expand();
          }
          expect(treeView.list.outerHeight()).toBeGreaterThan(treeView.scroller.outerHeight());
          expect(treeView.scrollTop()).toBe(0);
          treeView.trigger('core:move-to-bottom');
          expect(treeView.scrollBottom()).toBe(treeView.root.outerHeight());
          treeView.root.collapse();
          treeView.trigger('core:move-to-bottom');
          return expect(treeView.scrollTop()).toBe(0);
        });
        return it("selects the last entry", function() {
          expect(treeView.root).toHaveClass('selected');
          treeView.trigger('core:move-to-bottom');
          return expect(treeView.root.find('.entry:last')).toHaveClass('selected');
        });
      });
      describe("core:page-up", function() {
        return it("scrolls up a page", function() {
          var element, scrollTop, _i, _len, _ref2;
          treeView.height(5);
          treeView.attachToDom();
          _ref2 = treeView.find('.directory');
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            element = _ref2[_i];
            $(element).view().expand();
          }
          expect(treeView.list.outerHeight()).toBeGreaterThan(treeView.scroller.outerHeight());
          expect(treeView.scrollTop()).toBe(0);
          treeView.scrollToBottom();
          scrollTop = treeView.scrollTop();
          expect(scrollTop).toBeGreaterThan(0);
          treeView.trigger('core:page-up');
          return expect(treeView.scrollTop()).toBe(scrollTop - treeView.height());
        });
      });
      describe("core:page-down", function() {
        return it("scrolls down a page", function() {
          var element, _i, _len, _ref2;
          treeView.height(5);
          treeView.attachToDom();
          _ref2 = treeView.find('.directory');
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            element = _ref2[_i];
            $(element).view().expand();
          }
          expect(treeView.list.outerHeight()).toBeGreaterThan(treeView.scroller.outerHeight());
          expect(treeView.scrollTop()).toBe(0);
          treeView.trigger('core:page-down');
          return expect(treeView.scrollTop()).toBe(treeView.height());
        });
      });
      describe("movement outside of viewable region", function() {
        return it("scrolls the tree view to the selected item", function() {
          var element, entryCount, entryHeight, _i, _len, _ref2;
          treeView.height(100);
          treeView.attachToDom();
          _ref2 = treeView.find('.directory');
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            element = _ref2[_i];
            $(element).view().expand();
          }
          expect(treeView.list.outerHeight()).toBeGreaterThan(treeView.scroller.outerHeight());
          treeView.moveDown();
          expect(treeView.scrollTop()).toBe(0);
          entryCount = treeView.find(".entry").length;
          entryHeight = treeView.find('.file').height();
          _.times(entryCount, function() {
            return treeView.moveDown();
          });
          expect(treeView.scrollBottom()).toBeGreaterThan((entryCount * entryHeight) - 1);
          _.times(entryCount, function() {
            return treeView.moveUp();
          });
          return expect(treeView.scrollTop()).toBe(0);
        });
      });
      describe("tree-view:expand-directory", function() {
        describe("when a directory entry is selected", function() {
          return it("expands the current directory", function() {
            var subdir;
            subdir = treeView.root.find('.directory:first').view();
            subdir.click();
            subdir.collapse();
            expect(subdir).not.toHaveClass('expanded');
            treeView.trigger('tree-view:expand-directory');
            return expect(subdir).toHaveClass('expanded');
          });
        });
        return describe("when a file entry is selected", function() {
          return it("does nothing", function() {
            waitsForFileToOpen(function() {
              return treeView.root.find('.file').click();
            });
            return runs(function() {
              return treeView.trigger('tree-view:expand-directory');
            });
          });
        });
      });
      describe("tree-view:recursive-expand-directory", function() {
        return describe("when an collapsed root is recursively expanded", function() {
          return it("expands the root and all subdirectories", function() {
            var children;
            treeView.root.click();
            treeView.root.collapse();
            expect(treeView.root).not.toHaveClass('expanded');
            treeView.trigger('tree-view:recursive-expand-directory');
            expect(treeView.root).toHaveClass('expanded');
            children = treeView.root.find('.directory');
            expect(children.length).toBeGreaterThan(0);
            return children.each(function(index, child) {
              var childView;
              childView = $(child).view();
              return expect(childView).toHaveClass('expanded');
            });
          });
        });
      });
      describe("tree-view:collapse-directory", function() {
        var subdir;
        subdir = null;
        beforeEach(function() {
          subdir = treeView.root.find('> .entries > .directory').eq(0).view();
          return subdir.expand();
        });
        describe("when an expanded directory is selected", function() {
          return it("collapses the selected directory", function() {
            subdir.click().expand();
            expect(subdir).toHaveClass('expanded');
            treeView.trigger('tree-view:collapse-directory');
            expect(subdir).not.toHaveClass('expanded');
            return expect(treeView.root).toHaveClass('expanded');
          });
        });
        describe("when a collapsed directory is selected", function() {
          return it("collapses and selects the selected directory's parent directory", function() {
            subdir.find('.directory').view().click().collapse();
            treeView.trigger('tree-view:collapse-directory');
            expect(subdir).not.toHaveClass('expanded');
            expect(subdir).toHaveClass('selected');
            return expect(treeView.root).toHaveClass('expanded');
          });
        });
        describe("when collapsed root directory is selected", function() {
          return it("does not raise an error", function() {
            treeView.root.collapse();
            treeView.selectEntry(treeView.root);
            return treeView.trigger('tree-view:collapse-directory');
          });
        });
        return describe("when a file is selected", function() {
          return it("collapses and selects the selected file's parent directory", function() {
            waitsForFileToOpen(function() {
              return subdir.find('.file').click();
            });
            return runs(function() {
              treeView.trigger('tree-view:collapse-directory');
              expect(subdir).not.toHaveClass('expanded');
              expect(subdir).toHaveClass('selected');
              return expect(treeView.root).toHaveClass('expanded');
            });
          });
        });
      });
      describe("tree-view:recursive-collapse-directory", function() {
        var children, parent;
        parent = null;
        children = null;
        beforeEach(function() {
          parent = treeView.root.find('> .entries > .directory').eq(2).view();
          parent.expand();
          children = parent.find('.expanded.directory');
          return children.each(function(index, child) {
            return $(child).view().expand();
          });
        });
        return describe("when an expanded directory is recursively collapsed", function() {
          return it("collapses the directory and all its child directories", function() {
            parent.click().expand();
            expect(parent).toHaveClass('expanded');
            children.each(function(index, child) {
              $(child).view().click().expand();
              return expect($(child).view()).toHaveClass('expanded');
            });
            treeView.trigger('tree-view:recursive-collapse-directory');
            expect(parent).not.toHaveClass('expanded');
            children.each(function(index, child) {
              return expect($(child).view()).not.toHaveClass('expanded');
            });
            return expect(treeView.root).toHaveClass('expanded');
          });
        });
      });
      return describe("tree-view:open-selected-entry", function() {
        describe("when a file is selected", function() {
          beforeEach(function() {
            return atom.workspaceView.attachToDom();
          });
          return it("opens the file in the editor and focuses it", function() {
            waitsForFileToOpen(function() {
              return treeView.root.find('.file:contains(tree-view.js)').click();
            });
            waitsForFileToOpen(function() {
              return treeView.root.trigger('tree-view:open-selected-entry');
            });
            return runs(function() {
              expect(atom.workspace.getActivePaneItem().getPath()).toBe(atom.project.resolve('tree-view.js'));
              return expect(atom.workspaceView.getActiveView().isFocused).toBeTruthy();
            });
          });
        });
        describe("when a directory is selected", function() {
          return it("expands or collapses the directory", function() {
            var subdir;
            subdir = treeView.root.find('.directory').first().view();
            subdir.click().collapse();
            expect(subdir).not.toHaveClass('expanded');
            treeView.root.trigger('tree-view:open-selected-entry');
            expect(subdir).toHaveClass('expanded');
            treeView.root.trigger('tree-view:open-selected-entry');
            return expect(subdir).not.toHaveClass('expanded');
          });
        });
        return describe("when nothing is selected", function() {
          return it("does nothing", function() {
            treeView.root.trigger('tree-view:open-selected-entry');
            return expect(atom.workspaceView.getActiveView()).toBeUndefined();
          });
        });
      });
    });
    describe("file modification", function() {
      var dirPath, dirPath2, dirView, dirView2, filePath, filePath2, filePath3, fileView, fileView2, fileView3, rootDirPath, _ref2;
      _ref2 = [], dirView = _ref2[0], fileView = _ref2[1], dirView2 = _ref2[2], fileView2 = _ref2[3], fileView3 = _ref2[4], rootDirPath = _ref2[5], dirPath = _ref2[6], filePath = _ref2[7], dirPath2 = _ref2[8], filePath2 = _ref2[9], filePath3 = _ref2[10];
      beforeEach(function() {
        atom.packages.deactivatePackage('tree-view');
        rootDirPath = fs.absolute(temp.mkdirSync('tree-view'));
        dirPath = path.join(rootDirPath, "test-dir");
        filePath = path.join(dirPath, "test-file.txt");
        dirPath2 = path.join(rootDirPath, "test-dir2");
        filePath2 = path.join(dirPath2, "test-file2.txt");
        filePath3 = path.join(dirPath2, "test-file3.txt");
        fs.makeTreeSync(dirPath);
        fs.writeFileSync(filePath, "doesn't matter");
        fs.makeTreeSync(dirPath2);
        fs.writeFileSync(filePath2, "doesn't matter");
        fs.writeFileSync(filePath3, "doesn't matter");
        atom.project.setPath(rootDirPath);
        waitsForPromise(function() {
          return atom.packages.activatePackage('tree-view');
        });
        return runs(function() {
          atom.workspaceView.trigger('tree-view:toggle');
          treeView = atom.workspaceView.find(".tree-view").view();
          dirView = treeView.root.entries.find('.directory:contains(test-dir)').view();
          dirView.expand();
          fileView = treeView.find('.file:contains(test-file.txt)').view();
          dirView2 = treeView.root.entries.find('.directory:contains(test-dir2)').view();
          dirView2.expand();
          fileView2 = treeView.find('.file:contains(test-file2.txt)').view();
          return fileView3 = treeView.find('.file:contains(test-file3.txt)').view();
        });
      });
      describe("tree-view:copy", function() {
        var LocalStorage;
        LocalStorage = window.localStorage;
        beforeEach(function() {
          atom.workspaceView.attachToDom();
          LocalStorage.clear();
          waitsForFileToOpen(function() {
            return fileView2.click();
          });
          return runs(function() {
            return treeView.trigger("tree-view:copy");
          });
        });
        describe("when a file is selected", function() {
          it("saves the selected file/directory path to localStorage['tree-view:copyPath']", function() {
            return expect(LocalStorage['tree-view:copyPath']).toBeTruthy();
          });
          return it("Clears the localStorage['tree-view:cutPath']", function() {
            LocalStorage.clear();
            LocalStorage['tree-view:cutPath'] = "I live!";
            treeView.trigger("tree-view:copy");
            return expect(LocalStorage['tree-view:cutPath']).toBeFalsy;
          });
        });
        return describe('when multiple files are selected', function() {
          return it('saves the selected item paths in localStorage', function() {
            var storedPaths;
            fileView3.addClass('selected');
            treeView.trigger("tree-view:copy");
            storedPaths = JSON.parse(LocalStorage['tree-view:copyPath']);
            expect(storedPaths.length).toBe(2);
            expect(storedPaths[0]).toBe(fileView2.getPath());
            return expect(storedPaths[1]).toBe(fileView3.getPath());
          });
        });
      });
      describe("tree-view:cut", function() {
        var LocalStorage;
        LocalStorage = window.localStorage;
        beforeEach(function() {
          atom.workspaceView.attachToDom();
          LocalStorage.clear();
          waitsForFileToOpen(function() {
            return fileView2.click();
          });
          return runs(function() {
            return treeView.trigger("tree-view:cut");
          });
        });
        describe("when a file is selected", function() {
          it("saves the selected file/directory path to localStorage['tree-view:cutPath']", function() {
            return expect(LocalStorage['tree-view:cutPath']).toBeTruthy();
          });
          return it("Clears the localStorage['tree-view:copyPath']", function() {
            LocalStorage.clear();
            LocalStorage['tree-view:copyPath'] = "I live to CUT!";
            treeView.trigger("tree-view:cut");
            return expect(LocalStorage['tree-view:copyPath']).toBeFalsy();
          });
        });
        return describe('when multiple files are selected', function() {
          return it('saves the selected item paths in localStorage', function() {
            var storedPaths;
            LocalStorage.clear();
            fileView3.addClass('selected');
            treeView.trigger("tree-view:cut");
            storedPaths = JSON.parse(LocalStorage['tree-view:cutPath']);
            expect(storedPaths.length).toBe(2);
            expect(storedPaths[0]).toBe(fileView2.getPath());
            return expect(storedPaths[1]).toBe(fileView3.getPath());
          });
        });
      });
      describe("tree-view:paste", function() {
        var LocalStorage;
        LocalStorage = window.localStorage;
        beforeEach(function() {
          atom.workspaceView.attachToDom();
          return LocalStorage.clear();
        });
        describe("when attempting to paste a directory into itself", function() {
          describe("when copied", function() {
            it("makes a copy inside itself", function() {
              var newPath;
              LocalStorage['tree-view:copyPath'] = JSON.stringify([dirPath]);
              dirView.click();
              newPath = path.join(dirPath, path.basename(dirPath));
              expect(function() {
                return treeView.trigger("tree-view:paste");
              }).not.toThrow(new Error);
              return expect(fs.existsSync(newPath)).toBeTruthy();
            });
            return it('does not keep copying recursively', function() {
              var newPath;
              LocalStorage['tree-view:copyPath'] = JSON.stringify([dirPath]);
              dirView.click();
              newPath = path.join(dirPath, path.basename(dirPath));
              expect(function() {
                return treeView.trigger("tree-view:paste");
              }).not.toThrow(new Error);
              expect(fs.existsSync(newPath)).toBeTruthy();
              return expect(fs.existsSync(path.join(newPath, path.basename(dirPath)))).toBeFalsy();
            });
          });
          return describe("when cut", function() {
            return it("does nothing", function() {
              LocalStorage['tree-view:cutPath'] = JSON.stringify([dirPath]);
              dirView.click();
              expect(fs.existsSync(dirPath)).toBeTruthy();
              return expect(fs.existsSync(path.join(dirPath, path.basename(dirPath)))).toBeFalsy();
            });
          });
        });
        describe("when a file has been copied", function() {
          describe("when a file is selected", function() {
            it("creates a copy of the original file in the selected file's parent directory", function() {
              LocalStorage['tree-view:copyPath'] = JSON.stringify([filePath]);
              fileView2.click();
              treeView.trigger("tree-view:paste");
              expect(fs.existsSync(path.join(dirPath2, path.basename(filePath)))).toBeTruthy();
              return expect(fs.existsSync(filePath)).toBeTruthy();
            });
            return describe('when target already exists', function() {
              return it('appends a number to the destination name', function() {
                var fileArr, numberedFileName0, numberedFileName1;
                LocalStorage['tree-view:copyPath'] = JSON.stringify([filePath]);
                fileView.click();
                treeView.trigger("tree-view:paste");
                treeView.trigger("tree-view:paste");
                fileArr = filePath.split(path.sep).pop().split('.');
                numberedFileName0 = path.join(dirPath, "" + fileArr[0] + "0." + fileArr[1]);
                numberedFileName1 = path.join(dirPath, "" + fileArr[0] + "1." + fileArr[1]);
                expect(fs.existsSync(numberedFileName0)).toBeTruthy();
                expect(fs.existsSync(numberedFileName1)).toBeTruthy();
                return expect(fs.existsSync(filePath)).toBeTruthy();
              });
            });
          });
          return describe("when a directory is selected", function() {
            it("creates a copy of the original file in the selected directory", function() {
              LocalStorage['tree-view:copyPath'] = JSON.stringify([filePath]);
              dirView2.click();
              treeView.trigger("tree-view:paste");
              expect(fs.existsSync(path.join(dirPath2, path.basename(filePath)))).toBeTruthy();
              return expect(fs.existsSync(filePath)).toBeTruthy();
            });
            describe('when target already exists', function() {
              return it('appends a number to the destination directory name', function() {
                var fileArr, numberedFileName0, numberedFileName1;
                LocalStorage['tree-view:copyPath'] = JSON.stringify([filePath]);
                dirView.click();
                treeView.trigger("tree-view:paste");
                treeView.trigger("tree-view:paste");
                fileArr = filePath.split(path.sep).pop().split('.');
                numberedFileName0 = path.join(dirPath, "" + fileArr[0] + "0." + fileArr[1]);
                numberedFileName1 = path.join(dirPath, "" + fileArr[0] + "1." + fileArr[1]);
                expect(fs.existsSync(numberedFileName0)).toBeTruthy();
                expect(fs.existsSync(numberedFileName1)).toBeTruthy();
                return expect(fs.existsSync(filePath)).toBeTruthy();
              });
            });
            return describe("when nothing has been copied", function() {
              return it("does not paste anything", function() {
                return expect(function() {
                  return treeView.trigger("tree-view:paste");
                }).not.toThrow();
              });
            });
          });
        });
        describe("when multiple files have been copied", function() {
          return describe("when a file is selected", function() {
            it("copies the selected files to the parent directory of the selected file", function() {
              LocalStorage['tree-view:copyPath'] = JSON.stringify([filePath2, filePath3]);
              fileView.click();
              treeView.trigger("tree-view:paste");
              expect(fs.existsSync(path.join(dirPath, path.basename(filePath2)))).toBeTruthy();
              expect(fs.existsSync(path.join(dirPath, path.basename(filePath3)))).toBeTruthy();
              expect(fs.existsSync(filePath2)).toBeTruthy();
              return expect(fs.existsSync(filePath3)).toBeTruthy();
            });
            return describe('when the target destination file exists', function() {
              return it('appends a number to the duplicate destination target names', function() {
                var filePath4, filePath5;
                LocalStorage['tree-view:copyPath'] = JSON.stringify([filePath2, filePath3]);
                filePath4 = path.join(dirPath, "test-file2.txt");
                filePath5 = path.join(dirPath, "test-file3.txt");
                fs.writeFileSync(filePath4, "doesn't matter");
                fs.writeFileSync(filePath5, "doesn't matter");
                fileView.click();
                treeView.trigger("tree-view:paste");
                expect(fs.existsSync(path.join(dirPath, "test-file20.txt"))).toBeTruthy();
                return expect(fs.existsSync(path.join(dirPath, "test-file30.txt"))).toBeTruthy();
              });
            });
          });
        });
        describe("when a file has been cut", function() {
          describe("when a file is selected", function() {
            it("creates a copy of the original file in the selected file's parent directory and removes the original", function() {
              LocalStorage['tree-view:cutPath'] = JSON.stringify([filePath]);
              fileView2.click();
              treeView.trigger("tree-view:paste");
              expect(fs.existsSync(path.join(dirPath2, path.basename(filePath)))).toBeTruthy();
              return expect(fs.existsSync(filePath)).toBeFalsy();
            });
            return describe('when the target destination file exists', function() {
              return it('does not move the cut file', function() {
                LocalStorage['tree-view:cutPath'] = JSON.stringify([filePath]);
                filePath3 = path.join(dirPath2, "test-file.txt");
                fs.writeFileSync(filePath3, "doesn't matter");
                fileView2.click();
                treeView.trigger("tree-view:paste");
                return expect(fs.existsSync(filePath)).toBeTruthy();
              });
            });
          });
          return describe("when a directory is selected", function() {
            return it("creates a copy of the original file in the selected directory and removes the original", function() {
              LocalStorage['tree-view:cutPath'] = JSON.stringify([filePath]);
              dirView2.click();
              treeView.trigger("tree-view:paste");
              expect(fs.existsSync(path.join(dirPath2, path.basename(filePath)))).toBeTruthy();
              return expect(fs.existsSync(filePath)).toBeFalsy();
            });
          });
        });
        return describe("when multiple files have been cut", function() {
          describe("when a file is selected", function() {
            it("moves the selected files to the parent directory of the selected file", function() {
              LocalStorage['tree-view:cutPath'] = JSON.stringify([filePath2, filePath3]);
              fileView.click();
              treeView.trigger("tree-view:paste");
              expect(fs.existsSync(path.join(dirPath, path.basename(filePath2)))).toBeTruthy();
              expect(fs.existsSync(path.join(dirPath, path.basename(filePath3)))).toBeTruthy();
              expect(fs.existsSync(filePath2)).toBeFalsy();
              return expect(fs.existsSync(filePath3)).toBeFalsy();
            });
            return describe('when the target destination file exists', function() {
              return it('does not move the cut file', function() {
                var filePath4, filePath5;
                LocalStorage['tree-view:cutPath'] = JSON.stringify([filePath2, filePath3]);
                filePath4 = path.join(dirPath, "test-file2.txt");
                filePath5 = path.join(dirPath, "test-file3.txt");
                fs.writeFileSync(filePath4, "doesn't matter");
                fs.writeFileSync(filePath5, "doesn't matter");
                fileView.click();
                treeView.trigger("tree-view:paste");
                expect(fs.existsSync(filePath2)).toBeTruthy();
                return expect(fs.existsSync(filePath3)).toBeTruthy();
              });
            });
          });
          return describe("when a directory is selected", function() {
            return it("creates a copy of the original file in the selected directory and removes the original", function() {
              LocalStorage['tree-view:cutPath'] = JSON.stringify([filePath]);
              dirView2.click();
              treeView.trigger("tree-view:paste");
              expect(fs.existsSync(path.join(dirPath2, path.basename(filePath)))).toBeTruthy();
              return expect(fs.existsSync(filePath)).toBeFalsy();
            });
          });
        });
      });
      describe("tree-view:add", function() {
        var addDialog;
        addDialog = null;
        beforeEach(function() {
          atom.workspaceView.attachToDom();
          waitsForFileToOpen(function() {
            return fileView.click();
          });
          return runs(function() {
            treeView.trigger("tree-view:add-file");
            return addDialog = atom.workspaceView.find(".tree-view-dialog").view();
          });
        });
        describe("when a file is selected", function() {
          it("opens an add dialog with the file's current directory path populated", function() {
            expect(addDialog).toExist();
            expect(addDialog.promptText.text()).toBeTruthy();
            expect(atom.project.relativize(dirPath)).toMatch(/[^\/]$/);
            expect(addDialog.miniEditor.getText()).toBe(atom.project.relativize(dirPath) + "/");
            expect(addDialog.miniEditor.getEditor().getCursorBufferPosition().column).toBe(addDialog.miniEditor.getText().length);
            return expect(addDialog.miniEditor.isFocused).toBeTruthy();
          });
          describe("when the parent directory of the selected file changes", function() {
            return it("the active file is still shown as selected in the tree view", function() {
              var directoryModifiedHandler;
              directoryModifiedHandler = jasmine.createSpy("directory-modified");
              dirView.on("tree-view:directory-modified", directoryModifiedHandler);
              dirView.directory.emit('entry-removed', {
                name: 'deleted.txt'
              });
              expect(directoryModifiedHandler).toHaveBeenCalled();
              return expect(treeView.find('.selected').text()).toBe(path.basename(filePath));
            });
          });
          describe("when the path without a trailing '/' is changed and confirmed", function() {
            describe("when no file exists at that location", function() {
              return it("add a file, closes the dialog and selects the file in the tree-view", function() {
                var newPath;
                newPath = path.join(dirPath, "new-test-file.txt");
                addDialog.miniEditor.insertText(path.basename(newPath));
                waitsForFileToOpen(function() {
                  return addDialog.trigger('core:confirm');
                });
                runs(function() {
                  expect(fs.existsSync(newPath)).toBeTruthy();
                  expect(fs.isFileSync(newPath)).toBeTruthy();
                  expect(addDialog.parent()).not.toExist();
                  return expect(atom.workspace.getActivePaneItem().getPath()).toBe(newPath);
                });
                waitsFor("tree view to be updated", function() {
                  return dirView.entries.find("> .file").length > 1;
                });
                return runs(function() {
                  return expect(treeView.find('.selected').text()).toBe(path.basename(newPath));
                });
              });
            });
            return describe("when a file already exists at that location", function() {
              return it("shows an error message and does not close the dialog", function() {
                var newPath;
                newPath = path.join(dirPath, "new-test-file.txt");
                fs.writeFileSync(newPath, '');
                addDialog.miniEditor.insertText(path.basename(newPath));
                addDialog.trigger('core:confirm');
                expect(addDialog.errorMessage.text()).toContain('already exists');
                expect(addDialog).toHaveClass('error');
                return expect(addDialog.hasParent()).toBeTruthy();
              });
            });
          });
          describe("when the path with a trailing '/' is changed and confirmed", function() {
            return it("shows an error message and does not close the dialog", function() {
              addDialog.miniEditor.insertText("new-test-file/");
              addDialog.trigger('core:confirm');
              expect(addDialog.errorMessage.text()).toContain('names must not end with');
              expect(addDialog).toHaveClass('error');
              return expect(addDialog.hasParent()).toBeTruthy();
            });
          });
          describe("when 'core:cancel' is triggered on the add dialog", function() {
            return it("removes the dialog and focuses the tree view", function() {
              treeView.attachToDom();
              addDialog.trigger('core:cancel');
              expect(addDialog.parent()).not.toExist();
              return expect(treeView.find(".tree-view")).toMatchSelector(':focus');
            });
          });
          return describe("when the add dialog's editor loses focus", function() {
            return it("removes the dialog and focuses root view", function() {
              atom.workspaceView.attachToDom();
              atom.workspaceView.focus();
              expect(addDialog.parent()).not.toExist();
              return expect(atom.workspaceView.getActiveView().isFocused).toBeTruthy();
            });
          });
        });
        describe("when a directory is selected", function() {
          return it("opens an add dialog with the directory's path populated", function() {
            addDialog.cancel();
            dirView.click();
            treeView.trigger("tree-view:add-file");
            addDialog = atom.workspaceView.find(".tree-view-dialog").view();
            expect(addDialog).toExist();
            expect(addDialog.promptText.text()).toBeTruthy();
            expect(atom.project.relativize(dirPath)).toMatch(/[^\/]$/);
            expect(addDialog.miniEditor.getText()).toBe(atom.project.relativize(dirPath) + "/");
            expect(addDialog.miniEditor.getEditor().getCursorBufferPosition().column).toBe(addDialog.miniEditor.getText().length);
            return expect(addDialog.miniEditor.isFocused).toBeTruthy();
          });
        });
        describe("when the root directory is selected", function() {
          return it("opens an add dialog with no path populated", function() {
            addDialog.cancel();
            treeView.root.click();
            treeView.trigger("tree-view:add-file");
            addDialog = atom.workspaceView.find(".tree-view-dialog").view();
            return expect(addDialog.miniEditor.getText().length).toBe(0);
          });
        });
        return describe("when there is no entry selected", function() {
          return it("opens an add dialog with no path populated", function() {
            addDialog.cancel();
            treeView.root.click();
            treeView.root.removeClass('selected');
            expect(treeView.selectedEntry()).toBeUndefined();
            treeView.trigger("tree-view:add-file");
            addDialog = atom.workspaceView.find(".tree-view-dialog").view();
            return expect(addDialog.miniEditor.getText().length).toBe(0);
          });
        });
      });
      describe("tree-view:add-folder", function() {
        var addDialog;
        addDialog = null;
        beforeEach(function() {
          atom.workspaceView.attachToDom();
          waitsForFileToOpen(function() {
            return fileView.click();
          });
          return runs(function() {
            treeView.trigger("tree-view:add-folder");
            return addDialog = atom.workspaceView.find(".tree-view-dialog").view();
          });
        });
        return describe("when a file is selected", function() {
          it("opens an add dialog with the file's current directory path populated", function() {
            expect(addDialog).toExist();
            expect(addDialog.promptText.text()).toBeTruthy();
            expect(atom.project.relativize(dirPath)).toMatch(/[^\/]$/);
            expect(addDialog.miniEditor.getText()).toBe(atom.project.relativize(dirPath) + "/");
            expect(addDialog.miniEditor.getEditor().getCursorBufferPosition().column).toBe(addDialog.miniEditor.getText().length);
            return expect(addDialog.miniEditor.isFocused).toBeTruthy();
          });
          describe("when the path without a trailing '/' is changed and confirmed", function() {
            return describe("when no directory exists at the given path", function() {
              return it("adds a directory and closes the dialog", function() {
                var newPath;
                treeView.attachToDom();
                newPath = path.join(dirPath, "new/dir");
                addDialog.miniEditor.insertText("new/dir");
                addDialog.trigger('core:confirm');
                expect(fs.existsSync(newPath)).toBeTruthy();
                expect(fs.isDirectorySync(newPath)).toBeTruthy();
                expect(addDialog.parent()).not.toExist();
                expect(atom.workspace.getActivePaneItem().getPath()).not.toBe(newPath);
                expect(treeView.find(".tree-view")).toMatchSelector(':focus');
                expect(atom.workspaceView.getActiveView().isFocused).toBeFalsy();
                return expect(dirView.find('.directory.selected:contains(new)').length).toBe(1);
              });
            });
          });
          return describe("when the path with a trailing '/' is changed and confirmed", function() {
            describe("when no directory exists at the given path", function() {
              it("adds a directory and closes the dialog", function() {
                var newPath;
                treeView.attachToDom();
                newPath = path.join(dirPath, "new/dir");
                addDialog.miniEditor.insertText("new/dir/");
                addDialog.trigger('core:confirm');
                expect(fs.existsSync(newPath)).toBeTruthy();
                expect(fs.isDirectorySync(newPath)).toBeTruthy();
                expect(addDialog.parent()).not.toExist();
                expect(atom.workspace.getActivePaneItem().getPath()).not.toBe(newPath);
                expect(treeView.find(".tree-view")).toMatchSelector(':focus');
                expect(atom.workspaceView.getActiveView().isFocused).toBeFalsy();
                return expect(dirView.find('.directory.selected:contains(new)').length).toBe(1);
              });
              return it("selects the created directory and does not change the expansion state of existing directories", function() {
                var expandedPath, expandedView, newPath;
                expandedPath = path.join(dirPath, 'expanded-dir');
                fs.makeTreeSync(expandedPath);
                treeView.entryForPath(dirPath).expand();
                treeView.entryForPath(dirPath).reload();
                expandedView = treeView.entryForPath(expandedPath);
                expandedView.expand();
                treeView.attachToDom();
                newPath = path.join(dirPath, "new2/");
                addDialog.miniEditor.insertText("new2/");
                addDialog.trigger('core:confirm');
                expect(fs.existsSync(newPath)).toBeTruthy();
                expect(fs.isDirectorySync(newPath)).toBeTruthy();
                expect(addDialog.parent()).not.toExist();
                expect(atom.workspace.getActivePaneItem().getPath()).not.toBe(newPath);
                expect(treeView.find(".tree-view")).toMatchSelector(':focus');
                expect(atom.workspaceView.getActiveView().isFocused).toBeFalsy();
                expect(dirView.find('.directory.selected:contains(new2)').length).toBe(1);
                return expect(treeView.entryForPath(expandedPath).isExpanded).toBeTruthy();
              });
            });
            return describe("when a directory already exists at the given path", function() {
              return it("shows an error message and does not close the dialog", function() {
                var newPath;
                newPath = path.join(dirPath, "new-dir");
                fs.makeTreeSync(newPath);
                addDialog.miniEditor.insertText("new-dir/");
                addDialog.trigger('core:confirm');
                expect(addDialog.errorMessage.text()).toContain('already exists');
                expect(addDialog).toHaveClass('error');
                return expect(addDialog.hasParent()).toBeTruthy();
              });
            });
          });
        });
      });
      describe("tree-view:move", function() {
        describe("when a file is selected", function() {
          var moveDialog;
          moveDialog = null;
          beforeEach(function() {
            atom.workspaceView.attachToDom();
            waitsForFileToOpen(function() {
              return fileView.click();
            });
            return runs(function() {
              treeView.trigger("tree-view:move");
              return moveDialog = atom.workspaceView.find(".tree-view-dialog").view();
            });
          });
          afterEach(function() {
            return waits(50);
          });
          it("opens a move dialog with the file's current path (excluding extension) populated", function() {
            var extension, fileNameWithoutExtension;
            extension = path.extname(filePath);
            fileNameWithoutExtension = path.basename(filePath, extension);
            expect(moveDialog).toExist();
            expect(moveDialog.promptText.text()).toBe("Enter the new path for the file.");
            expect(moveDialog.miniEditor.getText()).toBe(atom.project.relativize(filePath));
            expect(moveDialog.miniEditor.getEditor().getSelectedText()).toBe(path.basename(fileNameWithoutExtension));
            return expect(moveDialog.miniEditor.isFocused).toBeTruthy();
          });
          describe("when the path is changed and confirmed", function() {
            describe("when all the directories along the new path exist", function() {
              return it("moves the file, updates the tree view, and closes the dialog", function() {
                var newPath;
                newPath = path.join(rootDirPath, 'renamed-test-file.txt');
                moveDialog.miniEditor.setText(newPath);
                moveDialog.trigger('core:confirm');
                expect(fs.existsSync(newPath)).toBeTruthy();
                expect(fs.existsSync(filePath)).toBeFalsy();
                expect(moveDialog.parent()).not.toExist();
                waitsFor("tree view to update", function() {
                  return treeView.root.find('> .entries > .file:contains(renamed-test-file.txt)').length > 0;
                });
                return runs(function() {
                  dirView = treeView.root.entries.find('.directory:contains(test-dir)').view();
                  dirView.expand();
                  return expect(dirView.entries.children().length).toBe(0);
                });
              });
            });
            describe("when the directories along the new path don't exist", function() {
              return it("creates the target directory before moving the file", function() {
                var newPath;
                newPath = path.join(rootDirPath, 'new/directory', 'renamed-test-file.txt');
                moveDialog.miniEditor.setText(newPath);
                moveDialog.trigger('core:confirm');
                waitsFor("tree view to update", function() {
                  return treeView.root.find('> .entries > .directory:contains(new)').length > 0;
                });
                return runs(function() {
                  expect(fs.existsSync(newPath)).toBeTruthy();
                  return expect(fs.existsSync(filePath)).toBeFalsy();
                });
              });
            });
            return describe("when a file or directory already exists at the target path", function() {
              return it("shows an error message and does not close the dialog", function() {
                return runs(function() {
                  var newPath;
                  fs.writeFileSync(path.join(rootDirPath, 'target.txt'), '');
                  newPath = path.join(rootDirPath, 'target.txt');
                  moveDialog.miniEditor.setText(newPath);
                  moveDialog.trigger('core:confirm');
                  expect(moveDialog.errorMessage.text()).toContain('already exists');
                  expect(moveDialog).toHaveClass('error');
                  return expect(moveDialog.hasParent()).toBeTruthy();
                });
              });
            });
          });
          describe("when 'core:cancel' is triggered on the move dialog", function() {
            return it("removes the dialog and focuses the tree view", function() {
              treeView.attachToDom();
              moveDialog.trigger('core:cancel');
              expect(moveDialog.parent()).not.toExist();
              return expect(treeView.find(".tree-view")).toMatchSelector(':focus');
            });
          });
          return describe("when the move dialog's editor loses focus", function() {
            return it("removes the dialog and focuses root view", function() {
              atom.workspaceView.attachToDom();
              atom.workspaceView.focus();
              expect(moveDialog.parent()).not.toExist();
              return expect(atom.workspaceView.getActiveView().isFocused).toBeTruthy();
            });
          });
        });
        describe("when a file is selected that's name starts with a '.'", function() {
          var dotFilePath, dotFileView, moveDialog, _ref3;
          _ref3 = [], dotFilePath = _ref3[0], dotFileView = _ref3[1], moveDialog = _ref3[2];
          beforeEach(function() {
            dotFilePath = path.join(dirPath, ".dotfile");
            fs.writeFileSync(dotFilePath, "dot");
            dirView.collapse();
            dirView.expand();
            dotFileView = treeView.find('.file:contains(.dotfile)').view();
            waitsForFileToOpen(function() {
              return dotFileView.click();
            });
            return runs(function() {
              treeView.trigger("tree-view:move");
              return moveDialog = atom.workspaceView.find(".tree-view-dialog").view();
            });
          });
          return it("selects the entire file name", function() {
            expect(moveDialog).toExist();
            expect(moveDialog.miniEditor.getText()).toBe(atom.project.relativize(dotFilePath));
            return expect(moveDialog.miniEditor.getEditor().getSelectedText()).toBe('.dotfile');
          });
        });
        return describe("when the project is selected", function() {
          return it("doesn't display the move dialog", function() {
            treeView.root.click();
            treeView.trigger("tree-view:move");
            return expect(atom.workspaceView.find(".tree-view-dialog").view()).not.toExist();
          });
        });
      });
      describe("tree-view:duplicate", function() {
        describe("when a file is selected", function() {
          var copyDialog;
          copyDialog = null;
          beforeEach(function() {
            atom.workspaceView.attachToDom();
            waitsForFileToOpen(function() {
              return fileView.click();
            });
            return runs(function() {
              treeView.trigger("tree-view:duplicate");
              return copyDialog = atom.workspaceView.find(".tree-view-dialog").view();
            });
          });
          afterEach(function() {
            return waits(50);
          });
          it("opens a copy dialog to duplicate with the file's current path populated", function() {
            var extension, fileNameWithoutExtension;
            extension = path.extname(filePath);
            fileNameWithoutExtension = path.basename(filePath, extension);
            expect(copyDialog).toExist();
            expect(copyDialog.promptText.text()).toBe("Enter the new path for the duplicate.");
            expect(copyDialog.miniEditor.getText()).toBe(atom.project.relativize(filePath));
            expect(copyDialog.miniEditor.getEditor().getSelectedText()).toBe(path.basename(fileNameWithoutExtension));
            return expect(copyDialog.miniEditor.isFocused).toBeTruthy();
          });
          describe("when the path is changed and confirmed", function() {
            describe("when all the directories along the new path exist", function() {
              return it("duplicates the file, updates the tree view, opens the new file and closes the dialog", function() {
                var newPath;
                newPath = path.join(rootDirPath, 'duplicated-test-file.txt');
                copyDialog.miniEditor.setText(newPath);
                waitsForFileToOpen(function() {
                  return copyDialog.trigger('core:confirm');
                });
                waitsFor("tree view to update", function() {
                  return treeView.root.find('> .entries > .file:contains(duplicated-test-file.txt)').length > 0;
                });
                return runs(function() {
                  treeView.trigger("tree-view:duplicate");
                  expect(fs.existsSync(newPath)).toBeTruthy();
                  expect(fs.existsSync(filePath)).toBeTruthy();
                  expect(copyDialog.parent()).not.toExist();
                  dirView = treeView.root.entries.find('.directory:contains(test-dir)').view();
                  dirView.expand();
                  expect(dirView.entries.children().length).toBe(1);
                  return expect(atom.workspace.getActiveEditor().getPath()).toBe(newPath);
                });
              });
            });
            describe("when the directories along the new path don't exist", function() {
              return it("duplicates the tree and opens the new file", function() {
                var newPath;
                newPath = path.join(rootDirPath, 'new/directory', 'duplicated-test-file.txt');
                copyDialog.miniEditor.setText(newPath);
                waitsForFileToOpen(function() {
                  return copyDialog.trigger('core:confirm');
                });
                waitsFor("tree view to update", function() {
                  return treeView.root.find('> .entries > .directory:contains(new)').length > 0;
                });
                waitsFor("new path to exist", function() {
                  return fs.existsSync(newPath);
                });
                return runs(function() {
                  expect(fs.existsSync(filePath)).toBeTruthy();
                  return expect(atom.workspace.getActiveEditor().getPath()).toBe(newPath);
                });
              });
            });
            return describe("when a file or directory already exists at the target path", function() {
              return it("shows an error message and does not close the dialog", function() {
                return runs(function() {
                  var newPath;
                  fs.writeFileSync(path.join(rootDirPath, 'target.txt'), '');
                  newPath = path.join(rootDirPath, 'target.txt');
                  copyDialog.miniEditor.setText(newPath);
                  copyDialog.trigger('core:confirm');
                  expect(copyDialog.errorMessage.text()).toContain('already exists');
                  expect(copyDialog).toHaveClass('error');
                  return expect(copyDialog.hasParent()).toBeTruthy();
                });
              });
            });
          });
          describe("when 'core:cancel' is triggered on the copy dialog", function() {
            return it("removes the dialog and focuses the tree view", function() {
              treeView.attachToDom();
              copyDialog.trigger('core:cancel');
              expect(copyDialog.parent()).not.toExist();
              return expect(treeView.find(".tree-view")).toMatchSelector(':focus');
            });
          });
          return describe("when the duplicate dialog's editor loses focus", function() {
            return it("removes the dialog and focuses root view", function() {
              atom.workspaceView.attachToDom();
              atom.workspaceView.focus();
              expect(copyDialog.parent()).not.toExist();
              return expect(atom.workspaceView.getActiveView().isFocused).toBeTruthy();
            });
          });
        });
        describe("when a file is selected that's name starts with a '.'", function() {
          var copyDialog, dotFilePath, dotFileView, _ref3;
          _ref3 = [], dotFilePath = _ref3[0], dotFileView = _ref3[1], copyDialog = _ref3[2];
          beforeEach(function() {
            dotFilePath = path.join(dirPath, ".dotfile");
            fs.writeFileSync(dotFilePath, "dot");
            dirView.collapse();
            dirView.expand();
            dotFileView = treeView.find('.file:contains(.dotfile)').view();
            waitsForFileToOpen(function() {
              return dotFileView.click();
            });
            return runs(function() {
              treeView.trigger("tree-view:duplicate");
              return copyDialog = atom.workspaceView.find(".tree-view-dialog").view();
            });
          });
          return it("selects the entire file name", function() {
            expect(copyDialog).toExist();
            expect(copyDialog.miniEditor.getText()).toBe(atom.project.relativize(dotFilePath));
            return expect(copyDialog.miniEditor.getEditor().getSelectedText()).toBe('.dotfile');
          });
        });
        describe("when the project is selected", function() {
          return it("doesn't display the copy dialog", function() {
            treeView.root.click();
            treeView.trigger("tree-view:duplicate");
            return expect(atom.workspaceView.find(".tree-view-dialog").view()).not.toExist();
          });
        });
        return describe("when the editor has focus", function() {
          var copyDialog;
          copyDialog = null;
          beforeEach(function() {
            waitsForPromise(function() {
              return atom.workspace.open('tree-view.js');
            });
            return runs(function() {
              var editorView;
              editorView = atom.workspaceView.getActiveView();
              editorView.trigger("tree-view:duplicate");
              return copyDialog = atom.workspaceView.find(".tree-view-dialog").view();
            });
          });
          return it("duplicates the current file", function() {
            return expect(copyDialog.miniEditor.getText()).toBe('tree-view.js');
          });
        });
      });
      return describe("tree-view:remove", function() {
        it("won't remove the root directory", function() {
          var args;
          spyOn(atom, 'confirm');
          atom.workspaceView.attachToDom();
          treeView.show();
          treeView.root.view().click();
          treeView.trigger('tree-view:remove');
          args = atom.confirm.mostRecentCall.args[0];
          return expect(args.buttons).toEqual(['OK']);
        });
        return it("shows the native alert dialog", function() {
          spyOn(atom, 'confirm');
          waitsForFileToOpen(function() {
            return fileView.click();
          });
          return runs(function() {
            var args;
            treeView.trigger('tree-view:remove');
            args = atom.confirm.mostRecentCall.args[0];
            return expect(Object.keys(args.buttons)).toEqual(['Move to Trash', 'Cancel']);
          });
        });
      });
    });
    describe("file system events", function() {
      var temporaryFilePath;
      temporaryFilePath = null;
      beforeEach(function() {
        atom.project.setPath(fs.absolute(temp.mkdirSync('tree-view')));
        return temporaryFilePath = path.join(atom.project.getPath(), 'temporary');
      });
      return describe("when a file is added or removed in an expanded directory", function() {
        return it("updates the directory view to display the directory's new contents", function() {
          var entriesCountBefore;
          entriesCountBefore = null;
          runs(function() {
            expect(fs.existsSync(temporaryFilePath)).toBeFalsy();
            entriesCountBefore = treeView.root.entries.find('.entry').length;
            return fs.writeFileSync(temporaryFilePath, 'hi');
          });
          waitsFor("directory view contens to refresh", function() {
            return treeView.root.entries.find('.entry').length === entriesCountBefore + 1;
          });
          runs(function() {
            expect(treeView.root.entries.find('.entry').length).toBe(entriesCountBefore + 1);
            expect(treeView.root.entries.find('.file:contains(temporary)')).toExist();
            return fs.removeSync(temporaryFilePath);
          });
          return waitsFor("directory view contens to refresh", function() {
            return treeView.root.entries.find('.entry').length === entriesCountBefore;
          });
        });
      });
    });
    describe("the hideVcsIgnoredFiles config option", function() {
      describe("when the project's path is the repository's working directory", function() {
        beforeEach(function() {
          var dotGit, dotGitFixture, ignoreFile, ignoredFile, projectPath;
          dotGitFixture = path.join(__dirname, 'fixtures', 'git', 'working-dir', 'git.git');
          projectPath = temp.mkdirSync('tree-view-project');
          dotGit = path.join(projectPath, '.git');
          fs.copySync(dotGitFixture, dotGit);
          ignoreFile = path.join(projectPath, '.gitignore');
          fs.writeFileSync(ignoreFile, 'ignored.txt');
          ignoredFile = path.join(projectPath, 'ignored.txt');
          fs.writeFileSync(ignoredFile, 'ignored text');
          atom.project.setPath(projectPath);
          return atom.config.set("tree-view.hideVcsIgnoredFiles", false);
        });
        return it("hides git-ignored files if the option is set, but otherwise shows them", function() {
          expect(treeView.find('.file:contains(ignored.txt)').length).toBe(1);
          atom.config.set("tree-view.hideVcsIgnoredFiles", true);
          expect(treeView.find('.file:contains(ignored.txt)').length).toBe(0);
          atom.config.set("tree-view.hideVcsIgnoredFiles", false);
          return expect(treeView.find('.file:contains(ignored.txt)').length).toBe(1);
        });
      });
      return describe("when the project's path is a subfolder of the repository's working directory", function() {
        beforeEach(function() {
          var fixturePath, ignoreFile, projectPath;
          fixturePath = path.join(__dirname, 'fixtures', 'tree-view');
          projectPath = temp.mkdirSync('tree-view-project');
          fs.copySync(fixturePath, projectPath);
          ignoreFile = path.join(projectPath, '.gitignore');
          fs.writeFileSync(ignoreFile, 'tree-view.js');
          atom.project.setPath(projectPath);
          return atom.config.set("tree-view.hideVcsIgnoredFiles", true);
        });
        return it("does not hide git ignored files", function() {
          return expect(treeView.find('.file:contains(tree-view.js)').length).toBe(1);
        });
      });
    });
    describe("the hideIgnoredNames config option", function() {
      beforeEach(function() {
        var dotGit, dotGitFixture, projectPath;
        atom.config.set('core.ignoredNames', ['.git', '*.js']);
        dotGitFixture = path.join(__dirname, 'fixtures', 'git', 'working-dir', 'git.git');
        projectPath = temp.mkdirSync('tree-view-project');
        dotGit = path.join(projectPath, '.git');
        fs.copySync(dotGitFixture, dotGit);
        fs.writeFileSync(path.join(projectPath, 'test.js'), '');
        fs.writeFileSync(path.join(projectPath, 'test.txt'), '');
        atom.project.setPath(projectPath);
        return atom.config.set("tree-view.hideIgnoredNames", false);
      });
      return it("hides ignored files if the option is set, but otherwise shows them", function() {
        expect(treeView.find('.directory .name:contains(.git)').length).toBe(1);
        expect(treeView.find('.directory .name:contains(test.js)').length).toBe(1);
        expect(treeView.find('.directory .name:contains(test.txt)').length).toBe(1);
        atom.config.set("tree-view.hideIgnoredNames", true);
        expect(treeView.find('.directory .name:contains(.git)').length).toBe(0);
        expect(treeView.find('.directory .name:contains(test.js)').length).toBe(0);
        expect(treeView.find('.directory .name:contains(test.txt)').length).toBe(1);
        atom.config.set("core.ignoredNames", []);
        expect(treeView.find('.directory .name:contains(.git)').length).toBe(1);
        expect(treeView.find('.directory .name:contains(test.js)').length).toBe(1);
        return expect(treeView.find('.directory .name:contains(test.txt)').length).toBe(1);
      });
    });
    describe("Git status decorations", function() {
      beforeEach(function() {
        var ignoreFile, ignoredFile, modifiedFile, newDir, newFile, originalFileContent, projectPath, workingDirFixture;
        projectPath = fs.realpathSync(temp.mkdirSync('tree-view-project'));
        workingDirFixture = path.join(__dirname, 'fixtures', 'git', 'working-dir');
        fs.copySync(workingDirFixture, projectPath);
        fs.moveSync(path.join(projectPath, 'git.git'), path.join(projectPath, '.git'));
        atom.project.setPath(projectPath);
        newDir = path.join(projectPath, 'dir2');
        fs.mkdirSync(newDir);
        newFile = path.join(newDir, 'new2');
        fs.writeFileSync(newFile, '');
        atom.project.getRepo().getPathStatus(newFile);
        ignoreFile = path.join(projectPath, '.gitignore');
        fs.writeFileSync(ignoreFile, 'ignored.txt');
        ignoredFile = path.join(projectPath, 'ignored.txt');
        fs.writeFileSync(ignoredFile, '');
        modifiedFile = path.join(projectPath, 'dir', 'b.txt');
        originalFileContent = fs.readFileSync(modifiedFile, 'utf8');
        fs.writeFileSync(modifiedFile, 'ch ch changes');
        atom.project.getRepo().getPathStatus(modifiedFile);
        treeView.updateRoot();
        return treeView.root.entries.find('.directory:contains(dir)').view().expand();
      });
      describe("when the project is the repository root", function() {
        return it("adds a custom style", function() {
          return expect(treeView.find('.icon-repo').length).toBe(1);
        });
      });
      describe("when a file is modified", function() {
        return it("adds a custom style", function() {
          treeView.root.entries.find('.directory:contains(dir)').view().expand();
          return expect(treeView.find('.file:contains(b.txt)')).toHaveClass('status-modified');
        });
      });
      describe("when a directory if modified", function() {
        return it("adds a custom style", function() {
          return expect(treeView.find('.directory:contains(dir)')).toHaveClass('status-modified');
        });
      });
      describe("when a file is new", function() {
        return it("adds a custom style", function() {
          treeView.root.entries.find('.directory:contains(dir2)').view().expand();
          return expect(treeView.find('.file:contains(new2)')).toHaveClass('status-added');
        });
      });
      describe("when a directory is new", function() {
        return it("adds a custom style", function() {
          return expect(treeView.find('.directory:contains(dir2)')).toHaveClass('status-added');
        });
      });
      return describe("when a file is ignored", function() {
        return it("adds a custom style", function() {
          return expect(treeView.find('.file:contains(ignored.txt)')).toHaveClass('status-ignored');
        });
      });
    });
    describe("when the resize handle is double clicked", function() {
      beforeEach(function() {
        return treeView.width(10).find('.list-tree').width(100);
      });
      return it("sets the width of the tree to be the width of the list", function() {
        expect(treeView.width()).toBe(10);
        treeView.find('.tree-view-resize-handle').trigger('dblclick');
        expect(treeView.width()).toBeGreaterThan(10);
        treeView.width(1000);
        treeView.find('.tree-view-resize-handle').trigger('dblclick');
        return expect(treeView.width()).toBeLessThan(1000);
      });
    });
    return describe("selecting items", function() {
      var dirPath, dirView, filePath1, filePath2, filePath3, fileView1, fileView2, fileView3, rootDirPath, _ref2;
      _ref2 = [], dirView = _ref2[0], fileView1 = _ref2[1], fileView2 = _ref2[2], fileView3 = _ref2[3], treeView = _ref2[4], rootDirPath = _ref2[5], dirPath = _ref2[6], filePath1 = _ref2[7], filePath2 = _ref2[8], filePath3 = _ref2[9];
      beforeEach(function() {
        atom.packages.deactivatePackage('tree-view');
        rootDirPath = fs.absolute(temp.mkdirSync('tree-view'));
        dirPath = path.join(rootDirPath, "test-dir");
        filePath1 = path.join(dirPath, "test-file1.txt");
        filePath2 = path.join(dirPath, "test-file2.txt");
        filePath3 = path.join(dirPath, "test-file3.txt");
        fs.makeTreeSync(dirPath);
        fs.writeFileSync(filePath1, "doesn't matter");
        fs.writeFileSync(filePath2, "doesn't matter");
        fs.writeFileSync(filePath3, "doesn't matter");
        atom.project.setPath(rootDirPath);
        waitsForPromise(function() {
          return atom.packages.activatePackage('tree-view');
        });
        return runs(function() {
          atom.workspaceView.trigger('tree-view:toggle');
          treeView = atom.workspaceView.find(".tree-view").view();
          dirView = treeView.root.entries.find('.directory:contains(test-dir)').view();
          dirView.expand();
          fileView1 = treeView.find('.file:contains(test-file1.txt)').view();
          fileView2 = treeView.find('.file:contains(test-file2.txt)').view();
          return fileView3 = treeView.find('.file:contains(test-file3.txt)').view();
        });
      });
      describe('selecting multiple items', function() {
        return it('switches the contextual menu to muli-select mode', function() {
          fileView1.click();
          fileView2.trigger($.Event('mousedown', {
            shiftKey: true
          }));
          expect(treeView.find('.tree-view')).toHaveClass('multi-select');
          fileView3.trigger($.Event('mousedown'));
          return expect(treeView.find('.tree-view')).toHaveClass('full-menu');
        });
      });
      return describe('selecting multiple items', function() {
        it('switches the contextual menu to muli-select mode', function() {
          fileView1.click();
          fileView2.trigger($.Event('mousedown', {
            shiftKey: true
          }));
          return expect(treeView.find('.tree-view')).toHaveClass('multi-select');
        });
        describe('using the shift key', function() {
          return it('selects the items between the already selected item and the shift clicked item', function() {
            fileView1.click();
            fileView3.trigger($.Event('mousedown', {
              shiftKey: true
            }));
            expect(fileView1).toHaveClass('selected');
            expect(fileView2).toHaveClass('selected');
            return expect(fileView3).toHaveClass('selected');
          });
        });
        describe('using the metakey(cmd) key', function() {
          return it('selects the cmd clicked item in addition to the original selected item', function() {
            fileView1.click();
            fileView3.trigger($.Event('mousedown', {
              metaKey: true
            }));
            expect(fileView1).toHaveClass('selected');
            expect(fileView3).toHaveClass('selected');
            return expect(fileView2).not.toHaveClass('selected');
          });
        });
        describe('non-darwin platform', function() {
          var originalPlatform;
          originalPlatform = process.platform;
          beforeEach(function() {
            return Object.defineProperty(process, "platform", {
              __proto__: null,
              value: 'win32'
            });
          });
          afterEach(function() {
            return Object.defineProperty(process, "platform", {
              __proto__: null,
              value: originalPlatform
            });
          });
          return describe('using the ctrl key', function() {
            return it('selects the ctrl clicked item in addition to the original selected item', function() {
              fileView1.click();
              fileView3.trigger($.Event('mousedown', {
                ctrlKey: true
              }));
              expect(fileView1).toHaveClass('selected');
              expect(fileView3).toHaveClass('selected');
              return expect(fileView2).not.toHaveClass('selected');
            });
          });
        });
        return describe('darwin platform', function() {
          var originalPlatform;
          originalPlatform = process.platform;
          beforeEach(function() {
            return Object.defineProperty(process, "platform", {
              __proto__: null,
              value: 'darwin'
            });
          });
          afterEach(function() {
            return Object.defineProperty(process, "platform", {
              __proto__: null,
              value: originalPlatform
            });
          });
          describe('using the ctrl key', function() {
            describe("previous item is selected but the ctrl clicked item is not", function() {
              it('selects the clicked item, but deselects the previous item', function() {
                fileView1.click();
                fileView3.trigger($.Event('mousedown', {
                  ctrlKey: true
                }));
                expect(fileView1).not.toHaveClass('selected');
                expect(fileView3).toHaveClass('selected');
                return expect(fileView2).not.toHaveClass('selected');
              });
              return it('displays the full contextual menu', function() {
                fileView1.click();
                fileView3.trigger($.Event('mousedown', {
                  ctrlKey: true
                }));
                expect(treeView.list).toHaveClass('full-menu');
                return expect(treeView.list).not.toHaveClass('multi-select');
              });
            });
            describe('previous item is selected including the ctrl clicked', function() {
              it('displays the multi-select menu', function() {
                fileView1.click();
                fileView3.trigger($.Event('mousedown', {
                  metaKey: true
                }));
                fileView3.trigger($.Event('mousedown', {
                  ctrlKey: true
                }));
                expect(treeView.list).not.toHaveClass('full-menu');
                return expect(treeView.list).toHaveClass('multi-select');
              });
              return it('does not deselect any of the items', function() {
                fileView1.click();
                fileView3.trigger($.Event('mousedown', {
                  metaKey: true
                }));
                fileView3.trigger($.Event('mousedown', {
                  ctrlKey: true
                }));
                expect(fileView1).toHaveClass('selected');
                return expect(fileView3).toHaveClass('selected');
              });
            });
            describe('when clicked item is the only item selected', function() {
              return it('displays the full contextual menu', function() {
                fileView1.click();
                fileView3.trigger($.Event('mousedown', {
                  ctrlKey: true
                }));
                expect(treeView.list).toHaveClass('full-menu');
                return expect(treeView.list).not.toHaveClass('multi-select');
              });
            });
            return describe('when no item is selected', function() {
              it('selects the ctrl clicked item', function() {
                fileView3.trigger($.Event('mousedown', {
                  ctrlKey: true
                }));
                return expect(fileView3).toHaveClass('selected');
              });
              return it('displays the full context menu', function() {
                fileView3.trigger($.Event('mousedown', {
                  ctrlKey: true
                }));
                expect(treeView.list).toHaveClass('full-menu');
                return expect(treeView.list).not.toHaveClass('multi-select');
              });
            });
          });
          return describe("right-clicking", function() {
            describe('when multiple items are selected', function() {
              return it('displays the multi-select context menu', function() {
                fileView1.click();
                fileView3.trigger($.Event('mousedown', {
                  metaKey: true
                }));
                fileView3.trigger($.Event('mousedown', {
                  button: 2
                }));
                expect(fileView1).toHaveClass('selected');
                expect(fileView3).toHaveClass('selected');
                expect(treeView.list).not.toHaveClass('full-menu');
                return expect(treeView.list).toHaveClass('multi-select');
              });
            });
            describe('when a single item is selected', function() {
              it('displays the full context menu', function() {
                fileView1.click();
                fileView3.trigger($.Event('mousedown', {
                  button: 2
                }));
                expect(treeView.list).toHaveClass('full-menu');
                return expect(treeView.list).not.toHaveClass('multi-select');
              });
              it('selects right clicked item', function() {
                fileView1.click();
                fileView3.trigger($.Event('mousedown', {
                  button: 2
                }));
                return expect(fileView3).toHaveClass('selected');
              });
              return it('de-selects the previously selected item', function() {
                fileView1.click();
                fileView3.trigger($.Event('mousedown', {
                  button: 2
                }));
                return expect(fileView1).not.toHaveClass('selected');
              });
            });
            return describe('when no item is selected', function() {
              it('selects the right clicked item', function() {
                fileView3.trigger($.Event('mousedown', {
                  button: 2
                }));
                return expect(fileView3).toHaveClass('selected');
              });
              return it('shows the full context menu', function() {
                fileView3.trigger($.Event('mousedown', {
                  button: 2
                }));
                expect(fileView3).toHaveClass('selected');
                expect(treeView.list).toHaveClass('full-menu');
                return expect(treeView.list).not.toHaveClass('multi-select');
              });
            });
          });
        });
      });
    });
  });

}).call(this);
