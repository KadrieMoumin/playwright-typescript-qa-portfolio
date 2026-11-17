// Static fixtures only: Semgrep reads this file; it is never executed.
function examples(input, element, connect) {
  // ruleid: no-dynamic-code
  eval(input);
  // ruleid: no-dynamic-code
  new Function(input);
  // ruleid: no-dynamic-code
  Function(input);
  // ok: no-dynamic-code
  JSON.parse(input);
  // ruleid: no-html-string-insertion
  element.innerHTML = input;
  // ruleid: no-html-string-insertion
  element.outerHTML = input;
  // ruleid: no-html-string-insertion
  element.insertAdjacentHTML('beforeend', input);
  // ok: no-html-string-insertion
  element.textContent = input;
  // ruleid: no-disabled-tls-verification
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  // ruleid: no-disabled-tls-verification
  connect({ rejectUnauthorized: false });
  // ok: no-disabled-tls-verification
  connect({ rejectUnauthorized: true });
}
