import React from "react";

export default function HeroSection({ region = "Saalekreis" }) {
  return (
    <div className="rounded-xl overflow-hidden border">
      <div
        style={{
          backgroundImage: "url(https://picsum.photos/1200/320?blur=1)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: 180,
          width: "100%",
        }}
      />
      <div className="p-4 grid gap-1">
        <h2 className="text-xl font-semibold">Willkommen bei StadtMeldung {region}</h2>
        <p className="text-gray-600 text-sm">Melde Probleme, stimme ab, diskutiere mit Nachbarn – und hilf mit, den {region} besser zu machen.</p>
      </div>
    </div>
  );
}
