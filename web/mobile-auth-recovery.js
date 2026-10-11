/* Android-only ProTrader account verification & password recovery.
   Uses existing server-side flows; does not bypass email verification, lockouts or Google auth. */
(() => {
  'use strict';
  if (!window.ProTraderMobile?.isNative) return;
  const BASE = 'https://protrader-backend-n8oj.onrender.com/api/auth';
  const VERIFY = 'protrade_email_verification_';
  const RESET = 'protrade_password_reset_';
  const safeEmail = value => String(value || '').trim().toLowerCase();
  const randomFlow = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2,'0')).join('');
  const jsonPost = async (path, payload) => {
    const response = await fetch(`${BASE}/${path}`, {method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload)});
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) throw new Error(data.message || `Request failed (${response.status})`);
    return data;
  };
  let panel, title, details, emailInput, action, actionLabel, close, timer;
  let mode = '', activeEmail = '', flowId = '', busy = false, polling = false;
  const notice = text => { if (details) details.textContent=text; };
  const stop = () => { if (timer) clearInterval(timer); timer=null; };
  const setBusy = state => { busy=state; if(action) action.disabled=state; };
  const closePanel = () => { stop(); if(panel) panel.hidden=true; mode=''; };
  const getFlowId = (prefix,email) => {
    const savedEmail = sessionStorage.getItem(`${prefix}email`);
    let saved = sessionStorage.getItem(`${prefix}session`);
    if(savedEmail !== email || !/^[a-f0-9]{64}$/.test(saved||'')) {
      saved=randomFlow();
      sessionStorage.setItem(`${prefix}session`,saved);
      sessionStorage.setItem(`${prefix}email`,email);
      sessionStorage.setItem(`${prefix}started_at`,String(Date.now()));
    }
    return saved;
  };
  const renderPanel=() => {
    if(panel) return;
    panel=document.createElement('div');
    panel.id='protrade-android-auth-modal';
    panel.hidden=true;
    panel.innerHTML=`<section class="pama-card" role="dialog" aria-modal="true" aria-labelledby="pama-title">
      <button type="button" id="pama-close" class="pama-close" aria-label="Close">×</button>
      <p class="pama-eyebrow">ProTrader · Account Security</p>
      <h2 id="pama-title"></h2>
      <p id="pama-info" role="status"></p>
      <label class="pama-label" for="pama-email">Account email</label>
      <input id="pama-email" type="email" autocomplete="email" placeholder="you@example.com"/>
      <button type="button" id="pama-action" class="pama-primary"><span id="pama-action-label"></span></button>
      <p class="pama-help">Open the verification/reset link from your email in Chrome. Return to this app afterwards. Your existing data stays on the online server.</p>
    </section>`;
    document.body.appendChild(panel);
    title=panel.querySelector('#pama-title');details=panel.querySelector('#pama-info');emailInput=panel.querySelector('#pama-email');action=panel.querySelector('#pama-action');
    actionLabel=panel.querySelector('#pama-action-label');close=panel.querySelector('#pama-close');
    close.addEventListener('click',closePanel);
    action.addEventListener('click', () => mode==='verify' ? resendVerification() : requestReset());
  };
  const startPoll = async () => {
    stop();
    timer=setInterval(async()=> {
      if(polling || !activeEmail || panel?.hidden) return;
      polling=true;
      try {
        if(mode==='verify') {
          const data=await jsonPost('verification-status',{email:activeEmail,sessionId:flowId});
          if(data.verified && data.token){
            sessionStorage.setItem('protrade_auth_token',data.token);
            sessionStorage.setItem('protrade_auth_user',JSON.stringify(data.data||null));
            stop();notice('Email verified! Opening ProTrader…');
            window.setTimeout(()=>location.replace('dashboard.html'),650);
          } else if(data.status==='expired') { stop(); notice('Verification waiting session expired. Tap Resend verification email.'); }
        }else if(mode==='reset') {
          const data=await jsonPost('password-reset-status',{email:activeEmail,sessionId:flowId});
          if(data.completed){stop(); notice('Password changed! Close this window and sign in with your new password.'); actionLabel.textContent='Send another reset link';}
          else if(data.status==='expired'){stop();notice('Reset waiting session expired. Request another reset email.');}
        }
      } catch(error) { console.warn('Account recovery polling:',error.message); }
      finally { polling=false; }
    },4000);
  };
  const resendVerification = async () => {
    if(busy)return;
    const email=safeEmail(emailInput.value);
    if(!email || !email.includes('@')){notice('Enter a valid email address.');return;}
    activeEmail=email;flowId=getFlowId(VERIFY,email);setBusy(true);
    try{
      const data=await jsonPost('resend-verification',{email,verificationSessionId:flowId});
      notice(data.message+' Check your inbox and spam folder.'); startPoll();
    }catch(error){notice(error.message);}finally{setBusy(false);}
  };
  const requestReset = async()=>{
    if(busy)return;
    const email=safeEmail(emailInput.value);
    if(!email || !email.includes('@')){notice('Enter a valid email address.');return;}
    activeEmail=email;flowId=getFlowId(RESET,email);setBusy(true);
    try{
      const data=await jsonPost('forgot-password',{email,passwordResetSessionId:flowId});
      notice(data.message+' Follow the link in Chrome, then return to ProTrader.'); startPoll();
    }catch(error){notice(error.message);}finally{setBusy(false);}
  };
  function showVerify({email,alreadySent=false,deliveryFailed=false}={}){
    renderPanel();stop();mode='verify';activeEmail=safeEmail(email);
    flowId=getFlowId(VERIFY,activeEmail);emailInput.value=activeEmail;
    title.textContent='Verify your email';actionLabel.textContent='Resend verification email';
    notice(deliveryFailed
      ? 'Your account was created, but the mail service failed to send the verification link. Do not register again. Try Resend once; if it fails, the administrator must check Brevo / Render email settings.'
      : alreadySent
        ? 'Account created. Check your inbox/spam for the verification email and open its link in Chrome.'
        : 'This account needs email verification. Tap Resend verification email below (this is not sent automatically).');
    panel.hidden=false;
    if(alreadySent)startPoll();
  }
  function showReset(prefill){
    renderPanel();stop();mode='reset';activeEmail=''; flowId='';
    emailInput.value=safeEmail(prefill) || safeEmail(document.getElementById('email')?.value);
    title.textContent='Reset your password';actionLabel.textContent='Send password reset email';
    notice('Use the same email as your existing ProTrader account. This also works for Google-only accounts that want to set a password.');
    panel.hidden=false;
  }
  window.ProTraderMobileAuth = Object.freeze({ showVerify, showReset });
  document.addEventListener('click',(event)=>{
    const anchor=event.target.closest?.('a[href]');
    if(anchor && /(?:^|\/)forgot-password\.html(?:[?#]|$)/.test(anchor.getAttribute('href')||'')){
      event.preventDefault();showReset();
    }
  });
})();