import React from "react";
import { Info } from "lucide-react";

export default function LegalImagesNotice() {
  return (
    <div className="text-xs text-gray-600 border rounded p-3 bg-gray-50">
      <div className="flex items-center gap-2 font-medium"><Info size={14}/> Bild- & Inhalts-Hinweis (Demo)</div>
      <ul className="list-disc pl-5 mt-1 space-y-1">
        <li>Lade nur Bilder hoch, an denen du die Rechte besitzt oder die keine Personen/Nummernschilder eindeutig zeigen.</li>
        <li>Keine sensiblen personenbezogenen Daten posten (Adresse, KFZ-Kennzeichen, Gesichter). Im Zweifel verpixeln.</li>
        <li>Mit dem Upload bestätigst du, dass du die Inhalte rechtmäßig teilen darfst.</li>
      </ul>
    </div>
  );
}
