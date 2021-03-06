(function() {
  var FileView, View,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  View = require('atom').View;

  module.exports = FileView = (function(_super) {
    __extends(FileView, _super);

    function FileView() {
      return FileView.__super__.constructor.apply(this, arguments);
    }

    FileView.content = function() {
      return this.li({
        "class": 'file entry list-item'
      }, (function(_this) {
        return function() {
          return _this.span({
            "class": 'name icon',
            outlet: 'fileName'
          });
        };
      })(this));
    };

    FileView.prototype.initialize = function(file) {
      var relativeFilePath;
      this.file = file;
      this.fileName.text(this.file.name);
      relativeFilePath = atom.project.relativize(this.file.path);
      this.fileName.attr('data-name', this.file.name);
      this.fileName.attr('data-path', relativeFilePath);
      if (this.file.symlink) {
        this.fileName.addClass('icon-file-symlink-file');
      } else {
        switch (this.file.type) {
          case 'binary':
            this.fileName.addClass('icon-file-binary');
            break;
          case 'compressed':
            this.fileName.addClass('icon-file-zip');
            break;
          case 'image':
            this.fileName.addClass('icon-file-media');
            break;
          case 'pdf':
            this.fileName.addClass('icon-file-pdf');
            break;
          case 'readme':
            this.fileName.addClass('icon-book');
            break;
          case 'text':
            this.fileName.addClass('icon-file-text');
        }
      }
      return this.subscribe(this.file.$status.onValue((function(_this) {
        return function(status) {
          _this.removeClass('status-ignored status-modified status-added');
          if (status != null) {
            return _this.addClass("status-" + status);
          }
        };
      })(this)));
    };

    FileView.prototype.getPath = function() {
      return this.file.path;
    };

    FileView.prototype.beforeRemove = function() {
      return this.file.destroy();
    };

    return FileView;

  })(View);

}).call(this);
