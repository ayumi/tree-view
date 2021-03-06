(function() {
  var $, Dialog, EditorView, View, path, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ref = require('atom'), $ = _ref.$, EditorView = _ref.EditorView, View = _ref.View;

  path = require('path');

  module.exports = Dialog = (function(_super) {
    __extends(Dialog, _super);

    function Dialog() {
      return Dialog.__super__.constructor.apply(this, arguments);
    }

    Dialog.content = function(_arg) {
      var prompt;
      prompt = (_arg != null ? _arg : {}).prompt;
      return this.div({
        "class": 'tree-view-dialog overlay from-top'
      }, (function(_this) {
        return function() {
          _this.label(prompt, {
            "class": 'icon',
            outlet: 'promptText'
          });
          _this.subview('miniEditor', new EditorView({
            mini: true
          }));
          return _this.div({
            "class": 'error-message',
            outlet: 'errorMessage'
          });
        };
      })(this));
    };

    Dialog.prototype.initialize = function(_arg) {
      var baseName, extension, iconClass, initialPath, range, select, selectionEnd, _ref1;
      _ref1 = _arg != null ? _arg : {}, initialPath = _ref1.initialPath, select = _ref1.select, iconClass = _ref1.iconClass;
      if (iconClass) {
        this.promptText.addClass(iconClass);
      }
      this.on('core:confirm', (function(_this) {
        return function() {
          return _this.onConfirm(_this.miniEditor.getText());
        };
      })(this));
      this.on('core:cancel', (function(_this) {
        return function() {
          return _this.cancel();
        };
      })(this));
      this.miniEditor.hiddenInput.on('focusout', (function(_this) {
        return function() {
          return _this.remove();
        };
      })(this));
      this.miniEditor.getEditor().getBuffer().on('changed', (function(_this) {
        return function() {
          return _this.showError();
        };
      })(this));
      this.miniEditor.setText(initialPath);
      if (select) {
        extension = path.extname(initialPath);
        baseName = path.basename(initialPath);
        if (baseName === extension) {
          selectionEnd = initialPath.length;
        } else {
          selectionEnd = initialPath.length - extension.length;
        }
        range = [[0, initialPath.length - baseName.length], [0, selectionEnd]];
        return this.miniEditor.getEditor().setSelectedBufferRange(range);
      }
    };

    Dialog.prototype.attach = function() {
      atom.workspaceView.append(this);
      this.miniEditor.focus();
      return this.miniEditor.scrollToCursorPosition();
    };

    Dialog.prototype.close = function() {
      this.remove();
      return atom.workspaceView.focus();
    };

    Dialog.prototype.cancel = function() {
      this.remove();
      return $('.tree-view').focus();
    };

    Dialog.prototype.showError = function(message) {
      if (message == null) {
        message = '';
      }
      this.errorMessage.text(message);
      if (message) {
        return this.flashError();
      }
    };

    return Dialog;

  })(View);

}).call(this);
