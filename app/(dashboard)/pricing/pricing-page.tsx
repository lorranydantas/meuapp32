"use client";

import { PricingLines } from "@/components/pricing-lines";
import Link from "next/link";
import { useMemo, useState } from "react";

interface StripeProduct {
  id: string;
  name: string;
  description: string | null;
  defaultPriceId?: string;
  metadata: { [key: string]: string };
  amount: number | undefined;
}

export function PricingPageClient({ products }: { products: StripeProduct[] }) {

  const [selected, setSelected] = useState("prod_SMGAD37AwtPZEL");

  const product = useMemo(() => products.find((item) => item.id === selected), [selected]);

  // const price = 
  
  return (
    <div className="grid grid-cols-12 gap-5 px-5 mx-auto container">
      <main className="col-span-12 md:col-span-8 py-12 space-y-2">
        <div className="p-6 border-b border-gray-200 bg-white">
          <h2 className="text-xl text-gray-700 mb-4">Überprüfte Adresse</h2>
          <div className="grid grid-cols-[120px_1fr] gap-y-2 text-gray-600">
            <div className="text-right pr-4 font-bold">PLZ</div>
            <div>88682</div>
            <div className="text-right pr-4 font-bold">Ort</div>
            <div>Salem</div>
            <div className="text-right pr-4 font-bold">Ortsteil</div>
            <div>Mittelstenweiler</div>
            <div className="text-right pr-4 font-bold">Straße</div>
            <div>Am Hungerberg</div>
            <div className="text-right pr-4 font-bold">Hausnummer</div>
            <div>1</div>
            <div className="text-right pr-4 font-bold">Hausnummernzusatz</div>
            <div></div>
          </div>
        </div>
        <div className="p-6 border-b border-gray-200 bg-white">
            <div className="flex">
              <div className="text-orange-400 mr-2">▶</div>
              <div className="text-gray-600 text-sm">
                <p>Hinweis: Hierbei handelt es sich um eine Vorbestellung eines GLASFASER.home-Tarifs. Dieses Produkt kann erst nach erfolgtem Glasfaserausbau bereitgestellt werden. Hierfür ist zusätzlich das Produkt GLASFASER Gebäudeanschluss (siehe dazu die <Link href="#" className="text-blue-600 hover:underline">Leistungsbeschreibung</Link>) vom Hauseigentümer zu beauftragen. Bitte kontaktieren Sie uns zur Beauftragung des GLASFASER Gebäudeanschlusses per <span className="font-semibold">E-Mail an </span>
                <Link href="mailto:glasfaser@netcom-bw.de" className="text-blue-600 hover:underline">glasfaser@netcom-bw.de</Link>.
                </p>
            </div>
          </div>
        </div>
        <div className="p-6 border-b border-gray-200 bg-white">
          <p className="text-gray-600 mb-4">An Ihrer Adresse sind folgende Produkte verfügbar:</p>
          <PricingLines products={products} selected={selected} setSelected={setSelected} />
        </div>
        <div className="p-6 border-b border-gray-200 bg-white">
          <p>
            Bitte beachten Sie, dass die Online-Bestellung ausschließlich für private Neukunden möglich ist.
          </p>  
          <p>
            Wenn Sie Ihren bestehenden NetCom BW Vertrag ändern möchten, können Sie den Wechsel über das Kundenportal beauftragen.
          </p>  
          <p>
            Wenn Sie von NeckarCom zu NetCom BW wechseln möchten, finden Sie alle Informationen hier.
          </p>  
          <p>
            Gewerbliche Anfragen werden von der Geschäftskundenbetreuung bearbeitet. Bitte wenden Sie sich in diesem Fall direkt an die E-Mail-Adresse <Link href="mailto:kmu@netcom-bw.de" className="text-blue-600 hover:underline">kmu@netcom-bw.de</Link>.
          </p>  
          <p>
            Bei dem Ergebnis der Verfügbarkeitsprüfung an Ihrer überprüften Adresse handelt es sich um keine verbindliche Zusage über die Möglichkeit des Anschlusses. Eine Abweichung im Rahmen der Leistungsbereitstellung bleibt vorbehalten.
          </p>
        </div>
      </main>
      <aside className="col-span-12 md:col-span-4 py-12 space-y-2">
        <h3 className="text-2xl font-bold text-gray-700">Tarif</h3>
        <div className="p-6 border-b border-gray-200 bg-white">
          <p>{product?.name || "GLASFASER.home 1000"}, optional waipu.tv verfügbar</p>
        </div>
        <h3 className="text-2xl font-bold text-gray-700">Monatliche Kosten</h3>
        <div className="p-6 border-b border-gray-200 bg-white divide-y-2">
          <div className="flex flex-row gap-4 justify-between pb-3">
            <p>GLASFASER.home 1000</p>
            <p>{product?.amount ? displayPrice(product.amount) : "99.99 €"}</p>
          </div>
          <div className="flex flex-row gap-4 justify-between text-orange-400 pt-3">
            <p>Endpreis</p>
            <p>{product?.amount ? displayPrice(product.amount) : "99.99 €"}</p>
          </div>
        </div>
      </aside>
    </div>
  );
}

function displayPrice(amount: number) {
  return (amount / 100).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
  });
}