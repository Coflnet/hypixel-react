import { startFlipSettingsBackupMigration } from './BackupFlipSettingsMigration'
import { startEmptyFlipRestrictionMigration } from './EmptyFlipRestrictionMigration'

export function startMigrations() {
    startFlipSettingsBackupMigration()
    startEmptyFlipRestrictionMigration()
}
