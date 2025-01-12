import type { App as FirebaseAdminApp } from 'firebase-admin/app'
import { getAppCheck as getAdminAppCheck } from 'firebase-admin/app-check'
import type { FirebaseApp } from 'firebase/app'
import { CustomProvider, initializeAppCheck } from 'firebase/app-check'
import { App, ref } from 'vue-demi'
import { AppCheckMap, AppCheckTokenInjectSymbol } from '../app-check'
import { getGlobalScope } from '../globals'

/**
 * Adds AppCheck using the Firebase Admin SDK. This is necessary on the Server if you have configured AppCheck on the
 * client.
 *
 * @param adminApp - firebase-admin app
 * @param firebaseApp - firebase/app initializeApp()
 * @param param2 options
 */
export function VueFireAppCheckServer(
  app: App,
  adminApp: FirebaseAdminApp,
  firebaseApp: FirebaseApp,
  {
    // default to 1 week
    ttlMillis = 604_800_000,
  }: {
    ttlMillis?: number
  } = {}
) {
  // Inject an empty token ref so the same code works on the client and server
  const token = getGlobalScope(firebaseApp, app).run(() => ref<string>())!
  app.provide(AppCheckTokenInjectSymbol, token)

  const appCheck = initializeAppCheck(firebaseApp, {
    provider: new CustomProvider({
      getToken: () =>
        getAdminAppCheck(adminApp)
          // NOTE: appId is checked on the module
          .createToken(firebaseApp.options.appId!, { ttlMillis })
          .then(({ token, ttlMillis: expireTimeMillis }) => ({
            token,
            expireTimeMillis,
          })),
    }),
    isTokenAutoRefreshEnabled: false,
  })
  AppCheckMap.set(firebaseApp, appCheck)
}
