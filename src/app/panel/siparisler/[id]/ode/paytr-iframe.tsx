"use client";

import Script from "next/script";

export function PaytrIframe({ token }: { token: string }) {
  return (
    <div>
      <Script
        src="https://www.paytr.com/js/iframeResizer.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          // @ts-expect-error -- iFrameResize, PayTR'nin dışarıdan yüklediği script tarafından tanımlanır.
          window.iFrameResize?.({}, "#paytriframe");
        }}
      />
      <iframe
        src={`https://www.paytr.com/odeme/guvenli/${token}`}
        id="paytriframe"
        title="PayTR Güvenli Ödeme"
        frameBorder={0}
        scrolling="no"
        style={{ width: "100%", minHeight: 600 }}
      />
    </div>
  );
}
