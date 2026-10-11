import { SocialLogin } from '@capgo/capacitor-social-login';
let initialized;
const WEB_CLIENT_ID = '549565823292-rqqbu007k2r5c62sp8ar078qavc35vcj.apps.googleusercontent.com';
window.ProTraderNativeGoogleSignIn = async () => {
  if (!window.Capacitor?.isNativePlatform?.()) throw new Error('Google native sign-in is only available inside the Android app.');
  if (!initialized) initialized = SocialLogin.initialize({google:{webClientId:WEB_CLIENT_ID,mode:'online'}}).catch(error => {initialized=undefined;throw error;});
  await initialized;
  const response = await SocialLogin.login({provider:'google',options:{scopes:['profile','email']}});
  const idToken = response?.result?.idToken;
  if (!idToken) throw new Error('Google did not return an ID token. Check package name, signing SHA-1 and Google Cloud Android OAuth client.');
  return idToken;
};
