const fs = require("fs");
const path = require("path");
const { app } = require("electron");
const { desktopLogger } = require("./logger");

const DEFAULT_RETENTION = 10;

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatTimestamp(date) {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return `${year}${month}${day}`;
}

function parseDateKeyFromFilename(filename) {
  const match = /^backup-(\d{8})-\d{6}\.db$/.exec(filename);
  return match ? match[1] : null;
}

function safeMkdir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

class DataSafetyManager {
  constructor({ dbPath, retentionCount }) {
    this.dbPath = dbPath;
    this.retentionCount = Number.isFinite(retentionCount) ? retentionCount : DEFAULT_RETENTION;
    this.db = null;
    this.health = { status: "UNKNOWN", message: null };
    this.lastBackup = { status: "NONE", at: null, message: null };
    this.recoveryMode = false;
  }

  setDb(db) {
    this.db = db;
  }

  setDbHealth(status, message) {
    this.health = { status, message: message || null };
  }

  getDbHealth() {
    return this.health;
  }

  setRecoveryMode(enabled) {
    this.recoveryMode = Boolean(enabled);
  }

  isRecoveryMode() {
    return this.recoveryMode;
  }

  getBackupStatus() {
    return this.lastBackup;
  }

  getBackupDir() {
    return path.join(app.getPath("userData"), "backups");
  }

  listBackups() {
    const dir = this.getBackupDir();
    if (!fs.existsSync(dir)) {
      return [];
    }
    const entries = fs
      .readdirSync(dir)
      .filter((name) => name.endsWith(".db"))
      .map((name) => {
        const fullPath = path.join(dir, name);
        const stat = fs.statSync(fullPath);
        return {
          id: name,
          filename: name,
          createdAt: stat.mtime.toISOString(),
          sizeBytes: stat.size
        };
      });

    return entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  rotateBackups() {
    const backups = this.listBackups();
    if (backups.length <= this.retentionCount) {
      return;
    }
    const toDelete = backups.slice(this.retentionCount);
    toDelete.forEach((backup) => {
      try {
        fs.unlinkSync(path.join(this.getBackupDir(), backup.filename));
      } catch (error) {
        // Keep rotation best-effort without crashing the app.
      }
    });
  }

  shouldCreateDailyBackup() {
    const backups = this.listBackups();
    const todayKey = formatDateKey(new Date());
    return !backups.some((backup) => parseDateKeyFromFilename(backup.filename) === todayKey);
  }

  createBackupCopy() {
    if (!fs.existsSync(this.dbPath)) {
      this.lastBackup = { status: "SKIPPED", at: null, message: "DB missing" };
      return null;
    }

    const dir = this.getBackupDir();
    safeMkdir(dir);
    const timestamp = formatTimestamp(new Date());
    const filename = `backup-${timestamp}.db`;
    const targetPath = path.join(dir, filename);

    fs.copyFileSync(this.dbPath, targetPath);
    this.rotateBackups();

    this.lastBackup = { status: "OK", at: new Date().toISOString(), message: null };
    return filename;
  }

  async createBackupNow() {
    const dir = this.getBackupDir();
    safeMkdir(dir);
    const timestamp = formatTimestamp(new Date());
    const filename = `backup-${timestamp}.db`;
    const targetPath = path.join(dir, filename);

    try {
      if (this.db && typeof this.db.backup === "function") {
        await this.db.backup(targetPath);
      } else {
        if (!fs.existsSync(this.dbPath)) {
          throw new Error("DB file missing.");
        }
        fs.copyFileSync(this.dbPath, targetPath);
      }
      this.rotateBackups();
      this.lastBackup = { status: "OK", at: new Date().toISOString(), message: null };
      return { filename };
    } catch (error) {
      this.lastBackup = {
        status: "FAILED",
        at: new Date().toISOString(),
        message: error instanceof Error ? error.message : "Backup failed"
      };
      desktopLogger.error("data-safety.backup.failed", { message: this.lastBackup.message });
      throw error;
    }
  }

  ensureStartupBackup() {
    try {
      return this.createBackupCopy();
    } catch (error) {
      this.lastBackup = {
        status: "FAILED",
        at: new Date().toISOString(),
        message: error instanceof Error ? error.message : "Backup failed"
      };
      desktopLogger.error("data-safety.startup-backup.failed", { message: this.lastBackup.message });
      throw error;
    }
  }

  async restoreBackup(filename) {
    const dir = this.getBackupDir();
    const sourcePath = path.join(dir, filename);

    if (!fs.existsSync(sourcePath)) {
      throw new Error("Backup file not found.");
    }

    try {
      if (this.db && typeof this.db.close === "function") {
        this.db.close();
      }
      fs.copyFileSync(sourcePath, this.dbPath);
      app.relaunch();
      app.exit(0);
      return { restored: true };
    } catch (error) {
      desktopLogger.error("data-safety.restore.failed", {
        message: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  restartApp() {
    if (this.db && typeof this.db.close === "function") {
      this.db.close();
    }
    app.relaunch();
    app.exit(0);
    return { restarted: true };
  }
}

module.exports = {
  DataSafetyManager
};
