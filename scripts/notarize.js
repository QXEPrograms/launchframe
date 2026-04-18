/**
 * Notarization script — runs automatically after electron-builder signs the app.
 *
 * SETUP:
 *  1. Generate an App-Specific Password at appleid.apple.com
 *  2. Set these environment variables before running `npm run dist`:
 *
 *       export APPLE_ID="your@apple.com"
 *       export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
 *       export APPLE_TEAM_ID="YOURTEAMID"
 *
 *  Then just run: npm run dist
 */

const { notarize } = require('@electron/notarize')

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context
  if (electronPlatformName !== 'darwin') return

  // Skip if credentials aren't set (e.g. local dev builds)
  if (!process.env.APPLE_ID) {
    console.log('⚠️  Skipping notarization — APPLE_ID not set.')
    return
  }

  const appName = context.packager.appInfo.productFilename
  const appPath = `${appOutDir}/${appName}.app`

  console.log(`\n🔏 Notarizing ${appPath}…`)

  await notarize({
    tool: 'notarytool',
    appPath,
    appleId:              process.env.APPLE_ID,
    appleIdPassword:      process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId:               process.env.APPLE_TEAM_ID
  })

  console.log('✅ Notarization complete.')
}
