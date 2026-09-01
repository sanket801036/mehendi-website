/* ============================================================
   PUBLISH - admin ka kaam seedha project folder me likhta hai
   ------------------------------------------------------------
   Chrome ki File System Access API se ek baar folder chun lo,
   phir har save pe js/config.js aur nayi photos apne aap disk pe
   likhi jaati hain. Matlab asli site turant update ho jaati hai -
   koi ZIP, koi copy-paste nahi.

   Purane/doosre browser (Firefox, Safari) me ye API nahi hai,
   wahan ZIP wala rasta chalta rehta hai.
   ============================================================ */
window.Publish = (function () {
  "use strict";

  var dirHandle = null;
  var listeners = [];

  function supported() {
    return typeof window.showDirectoryPicker === "function";
  }

  function onChange(fn) { listeners.push(fn); }
  function fire(state) { listeners.forEach(function (fn) { fn(state); }); }

  /* ---------------- Permission ---------------- */

  function verify(handle, ask) {
    if (!handle || !handle.queryPermission) return Promise.resolve(false);
    var opts = { mode: "readwrite" };
    return handle.queryPermission(opts).then(function (p) {
      if (p === "granted") return true;
      if (!ask) return false;
      return handle.requestPermission(opts).then(function (p2) { return p2 === "granted"; });
    }).catch(function () { return false; });
  }

  /** Galat folder chun liya to bacha lete hain - project ki pehchaan check karo */
  function looksLikeProject(handle) {
    return handle.getFileHandle("index.html").then(function () {
      return handle.getDirectoryHandle("js");
    }).then(function (js) {
      return js.getFileHandle("config.js");
    }).then(function () { return true; })
      .catch(function () { return false; });
  }

  /* ---------------- Connect ---------------- */

  function connect() {
    if (!supported()) {
      return Promise.reject(new Error("Ye browser folder access support nahi karta. Chrome/Edge use kijiye."));
    }
    return window.showDirectoryPicker({ mode: "readwrite" }).then(function (handle) {
      return looksLikeProject(handle).then(function (ok) {
        if (!ok) {
          throw new Error("Ye website ka folder nahi lag raha. Wo folder chuniye jisme index.html hai.");
        }
        return verify(handle, true).then(function (granted) {
          if (!granted) throw new Error("Folder me likhne ki permission nahi mili.");
          dirHandle = handle;
          return Store.putHandle(handle).then(function () {
            fire({ connected: true, name: handle.name });
            return handle.name;
          });
        });
      });
    });
  }

  /** Page reload ke baad purana handle wapas lo (permission dobara maangni pad sakti hai) */
  function restore(ask) {
    if (!supported()) return Promise.resolve(false);
    return Store.getHandle().then(function (handle) {
      if (!handle) return false;
      return verify(handle, !!ask).then(function (ok) {
        if (!ok) {
          fire({ connected: false, needsPermission: true, name: handle.name });
          return false;
        }
        dirHandle = handle;
        fire({ connected: true, name: handle.name });
        return true;
      });
    }).catch(function () { return false; });
  }

  function disconnect() {
    dirHandle = null;
    return Store.clearHandle().then(function () { fire({ connected: false }); });
  }

  function isConnected() { return !!dirHandle; }
  function folderName() { return dirHandle ? dirHandle.name : null; }

  /* ---------------- Likhna ---------------- */

  function dirFor(path, create) {
    var parts = path.split("/");
    var p = Promise.resolve(dirHandle);
    for (var i = 0; i < parts.length - 1; i++) {
      (function (name) {
        p = p.then(function (d) { return d.getDirectoryHandle(name, { create: !!create }); });
      })(parts[i]);
    }
    return p.then(function (d) { return { dir: d, name: parts[parts.length - 1] }; });
  }

  function writeFile(path, contents) {
    return dirFor(path, true).then(function (t) {
      return t.dir.getFileHandle(t.name, { create: true });
    }).then(function (fh) {
      return fh.createWritable();
    }).then(function (w) {
      return w.write(contents).then(function () { return w.close(); });
    });
  }

  function removeFile(path) {
    return dirFor(path, false).then(function (t) {
      return t.dir.removeEntry(t.name);
    }).catch(function () { /* file pehle se nahi hai to koi baat nahi */ });
  }

  /* ---------------- Publish ---------------- */

  /**
   * config.js + jo photos abhi tak disk pe nahi gayi, sab likh deta hai.
   * Likhi hui photos par `written: true` lag jaata hai taaki dobara na likhein.
   */
  function run(data) {
    if (!dirHandle) return Promise.reject(new Error("Pehle folder jodiye"));

    var pending = (data.gallery || []).filter(function (g) {
      return !g.builtin && !g.written;
    });

    var chain = Promise.resolve();
    var wrote = [];

    pending.forEach(function (g) {
      chain = chain.then(function () {
        return Store.getImage(g.file).then(function (blob) {
          if (!blob) return;
          return writeFile("images/gallery/" + g.file, blob).then(function () {
            g.written = true;
            wrote.push(g.file);
          });
        });
      });
    });

    return chain.then(function () {
      return writeFile("js/config.js", Exporter.buildConfig(data));
    }).then(function () {
      Store.save(data);        // `written` flags bhi save ho jayein
      return { photos: wrote.length, files: wrote };
    });
  }

  /** Design delete hone par uski photo bhi folder se hata do */
  function removeImage(file) {
    if (!dirHandle || !file) return Promise.resolve();
    return removeFile("images/gallery/" + file);
  }

  /** Koi bhi text file folder me likho (gate isse admin-auth.js likhta hai) */
  function writeText(path, text) {
    if (!dirHandle) return Promise.reject(new Error("Pehle folder jodiye"));
    return writeFile(path, text);
  }

  return {
    writeText: writeText,
    supported: supported,
    connect: connect,
    restore: restore,
    disconnect: disconnect,
    isConnected: isConnected,
    folderName: folderName,
    run: run,
    removeImage: removeImage,
    onChange: onChange,
  };
})();
