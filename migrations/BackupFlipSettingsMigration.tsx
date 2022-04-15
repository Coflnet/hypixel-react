export function startFlipSettingsBackupMigration() {
    let currentSettings = localStorage.getItem('userSettings')
    let backup = localStorage.getItem('backup_userSettings')
    if (currentSettings && !backup) {
        localStorage.setItem('backup_userSettings', currentSettings)
    }
}
