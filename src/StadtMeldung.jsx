import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  MapPin as MapPinIcon,
  CheckCircle as CheckCircleIcon,
  Trash2 as Trash2Icon,
  RefreshCcw as RefreshCcwIcon,
  Download as DownloadIcon,
  ThumbsUp as ThumbsUpIcon,
  LogIn as LogInIcon,
  LogOut as LogOutIcon,
  User as UserIcon,
  Shield as ShieldIcon,
  Filter as FilterIcon,
  Bell as BellIcon,
  Check as ApproveIcon,
  X as RejectIcon,
  Map as MapIcon,
  BarChart3 as ChartIcon,
  Plus as PlusIcon,
  Bookmark as BookmarkIcon,
  Globe as GlobeIcon,
  Clock as ClockIcon,
  Send as SendIcon,
  Info as InfoIcon,
} from "lucide-react";

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

// ➕ Zusatz-Komponenten
import ChatWidget from "./components/ChatWidget";
import ForumBoard from "./components/ForumBoard";
import LegalImagesNotice from "./components/LegalImagesNotice";
import HeroSection from "./components/HeroSection";

// Kleiner Icon-Wrapper (robuster in Buttons)
const Icon = ({ children }) => (
  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, marginRight: 8 }}>
    {children}
  </span>
);

// Leaflet Marker-Icons aus CDN (vermeidet require()-Fehler)
const DefaultIcon = L.icon({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapClickSetter({ setLocation }) {
  useMapEvents({
    click(e) {
      setLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// Helpers
const uid = () => Math.floor(Math.random() * 1e9).toString(36) + Date.now().toString(36);
const now = () => Date.now();
const formatTs = (ts) => (ts ? new Date(ts).toLocaleString() : "—");

function useDeviceId() {
  const [deviceId, setDeviceId] = useState(null);
  useEffect(() => {
    let id = localStorage.getItem("stadtmeldung_device_id");
    if (!id) {
      id = uid();
      localStorage.setItem("stadtmeldung_device_id", id);
    }
    setDeviceId(id);
  }, []);
  return deviceId;
}

// Region (Saalekreis)
const REGION_NAME = "Saalekreis";
const REGION_CENTER = { lat: 51.3547, lng: 11.9892, area: "Merseburg", zip: "06217" };

// Demo-Geocoder Orte/PLZ Saalekreis
const DEMO_GEOCODER = {
  merseburg: { lat: 51.3547, lng: 11.9892, area: "Merseburg", zip: "06217" },
  leuna: { lat: 51.3174, lng: 12.0151, area: "Leuna", zip: "06237" },
  "bad dürrenberg": { lat: 51.2976, lng: 12.0678, area: "Bad Dürrenberg", zip: "06231" },
  schkopau: { lat: 51.4155, lng: 12.0551, area: "Schkopau", zip: "06258" },
  kabelsketal: { lat: 51.4404, lng: 12.0818, area: "Kabelsketal", zip: "06184" },
  landsberg: { lat: 51.5299, lng: 12.1611, area: "Landsberg", zip: "06188" },
  petersberg: { lat: 51.5793, lng: 11.9485, area: "Petersberg", zip: "06193" },
  "wettin-löbejün": { lat: 51.606, lng: 11.846, area: "Wettin-Löbejün", zip: "06193" },
  salzatal: { lat: 51.55, lng: 11.8, area: "Salzatal", zip: "06198" },
  teutschenthal: { lat: 51.45, lng: 11.8, area: "Teutschenthal", zip: "06179" },
  braunsbedra: { lat: 51.3, lng: 11.88, area: "Braunsbedra", zip: "06242" },
  "mücheln": { lat: 51.3, lng: 11.78, area: "Mücheln (Geiseltal)", zip: "06249" },
  querfurt: { lat: 51.381, lng: 11.6, area: "Querfurt", zip: "06268" },
};

// Kategorien
const CATEGORIES = [
  { value: "müll", label: "Müll" },
  { value: "schlagloch", label: "Schlagloch" },
  { value: "licht", label: "Defekte Beleuchtung" },
  { value: "baum", label: "Umgestürzter Baum" },
  { value: "ast", label: "Großer Ast" },
  { value: "graffiti", label: "Graffiti/Vandalismus" },
  { value: "wasser", label: "Wasserrohrbruch/Leck" },
  { value: "verkehr", label: "Defektes Verkehrsschild" },
  { value: "spielplatz", label: "Spielplatz-Schaden" },
  { value: "laerm", label: "Lärm/Belästigung" },
  { value: "verschmutzung", label: "Verschmutzung" },
  { value: "wildparken", label: "Wildparken" },
  { value: "anderes", label: "Anderes" },
];

export default function StadtMeldung() {
  const deviceId = useDeviceId();

  // Auth (Demo)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("stadtmeldung_user");
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });
  useEffect(() => {
    try {
      if (currentUser) localStorage.setItem("stadtmeldung_user", JSON.stringify(currentUser));
      else localStorage.removeItem("stadtmeldung_user");
    } catch {}
  }, [currentUser]);

  const [adminMode, setAdminMode] = useState(false);
  useEffect(() => {
    if (!currentUser?.isAdmin && !currentUser?.isModerator) setAdminMode(false);
  }, [currentUser]);

  // Subscriptions
  const [subscriptions, setSubscriptions] = useState(() => {
    try {
      const saved = localStorage.getItem("stadtmeldung_subs");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  useEffect(() => {
    try {
      localStorage.setItem("stadtmeldung_subs", JSON.stringify(subscriptions));
    } catch {}
  }, [subscriptions]);

  const [notifyOnStatus, setNotifyOnStatus] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("stadtmeldung_notify_status") || "false");
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("stadtmeldung_notify_status", JSON.stringify(notifyOnStatus));
    } catch {}
  }, [notifyOnStatus]);

  // Geocoder
  const [useLiveGeocode, setUseLiveGeocode] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("stadtmeldung_live_geocode") || "false");
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("stadtmeldung_live_geocode", JSON.stringify(useLiveGeocode));
    } catch {}
  }, [useLiveGeocode]);

  // Seed Reports (Saalekreis)
  const [reports, setReports] = useState(() => {
    try {
      const saved = localStorage.getItem("stadtmeldung_reports");
      if (saved) return JSON.parse(saved);
    } catch {}
    const created = now() - 1000 * 60 * 60 * 24;
    return [
      {
        id: 1,
        category: "müll",
        description: "Testmeldung: Müll am Marktplatz",
        image: null,
        location: { ...REGION_CENTER },
        status: "gemeldet",
        reporterId: null,
        votes: { count: 2, voters: ["seed-a", "seed-b"] },
        approved: true,
        createdAt: created,
        statusHistory: [{ status: "gemeldet", at: created }],
      },
      {
        id: 2,
        category: "schlagloch",
        description: "Schlagloch auf Hauptstraße",
        image: null,
        location: DEMO_GEOCODER.leuna,
        status: "angenommen",
        reporterId: null,
        votes: { count: 1, voters: ["seed-c"] },
        approved: true,
        createdAt: created - 3600000,
        statusHistory: [
          { status: "gemeldet", at: created - 3600000 },
          { status: "angenommen", at: created - 1800000 },
        ],
      },
      {
        id: 3,
        category: "licht",
        description: "Laterne defekt im Park",
        image: null,
        location: DEMO_GEOCODER.kabelsketal,
        status: "erledigt",
        reporterId: null,
        votes: { count: 0, voters: [] },
        approved: true,
        createdAt: created - 7200000,
        statusHistory: [
          { status: "gemeldet", at: created - 7200000 },
          { status: "angenommen", at: created - 5400000 },
          { status: "erledigt", at: created - 600000 },
        ],
      },
      {
        id: 4,
        category: "baum",
        description: "Umgestürzter Baum blockiert Radweg",
        image: null,
        location: DEMO_GEOCODER.braunsbedra,
        status: "gemeldet",
        reporterId: null,
        votes: { count: 4, voters: ["seed-a", "seed-d", "seed-e", "seed-f"] },
        approved: true,
        createdAt: created - 2700000,
        statusHistory: [{ status: "gemeldet", at: created - 2700000 }],
      },
      {
        id: 5,
        category: "verschmutzung",
        description: "Ölspur nahe Kreuzung",
        image: null,
        location: DEMO_GEOCODER.salzatal,
        status: "gemeldet",
        reporterId: null,
        votes: { count: 0, voters: [] },
        approved: false,
        createdAt: created,
        statusHistory: [{ status: "gemeldet", at: created }],
      },
    ];
  });

  // Form state
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [anonymous, setAnonymous] = useState(true);
  const [address, setAddress] = useState("");
  const [areaFilter, setAreaFilter] = useState("alle");

  // Filter/Search
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("alle");
  const [categoryFilter, setCategoryFilter] = useState("alle");
  const [sortBy, setSortBy] = useState("neueste");
  const [onlyMine, setOnlyMine] = useState(false);
  const [showUnapproved, setShowUnapproved] = useState(false);

  // persist
  useEffect(() => {
    try {
      localStorage.setItem("stadtmeldung_reports", JSON.stringify(reports));
    } catch {}
  }, [reports]);

  const handleImageChange = (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return setImage(null);
    const url = URL.createObjectURL(file);
    setImage(url);
  };

  const notify = (title, body) => {
    try {
      if (!("Notification" in window)) return;
      if (Notification.permission === "granted") new Notification(title, { body });
    } catch {}
  };

  const handleSubmit = () => {
    if (!category) return alert("Bitte Kategorie wählen");
    if (!description.trim()) return alert("Bitte Beschreibung eingeben");
    if (!location) return alert("Bitte einen Standort setzen (Karte klicken, Button oder Geocoding)");

    const reporterId = anonymous ? null : currentUser?.id || deviceId;
    const newReport = {
      id: Date.now(),
      category,
      description,
      image,
      location,
      status: "gemeldet",
      reporterId: reporterId || null,
      votes: { count: 0, voters: [] },
      approved: false,
      createdAt: now(),
      statusHistory: [{ status: "gemeldet", at: now() }],
      forwarded: false,
    };

    setReports((prev) => [newReport, ...prev]);

    const area = newReport.location?.area?.toLowerCase();
    const zip = newReport.location?.zip;
    const hit =
      subscriptions.find((s) => s.type === "area" && s.value.toLowerCase() === (area || "")) ||
      subscriptions.find((s) => s.type === "zip" && s.value === zip);
    if (hit) notify("Neue Meldung", `${newReport.category} in ${newReport.location?.area || REGION_NAME}`);

    setCategory("");
    setDescription("");
    setImage(null);
    setLocation(null);
    setAddress("");
  };

  const handleSetDummyLocation = () => setLocation({ ...REGION_CENTER });

  // Geocoding
  const liveGeocode = async (q) => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q + ", " + REGION_NAME)}&addressdetails=1&limit=1`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = await res.json();
      const hit = data?.[0];
      if (!hit) return null;
      const lat = parseFloat(hit.lat),
        lng = parseFloat(hit.lon);
      const addr = hit.address || {};
      const area = addr.suburb || addr.neighbourhood || addr.city_district || addr.town || addr.city || "";
      const zip = addr.postcode || "";
      return { lat, lng, area, zip };
    } catch (e) {
      console.warn("Geocoding failed", e);
      return null;
    }
  };

  const handleGeocode = async () => {
    const q = (address || "").trim();
    if (!q) return;
    if (useLiveGeocode) {
      const loc = await liveGeocode(q);
      if (loc) setLocation(loc);
      else alert("Adresse nicht gefunden (Live-Geocoder)");
    } else {
      const key = q.toLowerCase();
      const hit = DEMO_GEOCODER[key];
      if (hit) setLocation(hit);
      else
        alert(
          "(Demo) Beispiele: Merseburg, Leuna, Bad Dürrenberg, Schkopau, Kabelsketal, Landsberg, Petersberg, Wettin-Löbejün, Salzatal, Teutschenthal, Braunsbedra, Mücheln, Querfurt"
        );
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Meldung wirklich löschen?")) {
      setReports((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleStatusChange = (id) => {
    setReports((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const canChange =
          currentUser?.isAdmin || currentUser?.isModerator || (currentUser && r.reporterId && r.reporterId === currentUser.id);
        if (!canChange) return r;
        const prevStatus = r.status;
        const next = r.status === "gemeldet" ? "angenommen" : r.status === "angenommen" ? "erledigt" : "gemeldet";
        const updated = { ...r, status: next, statusHistory: [...(r.statusHistory || []), { status: next, at: now() }] };
        if (currentUser && r.reporterId && r.reporterId === currentUser.id) {
          notify("Status aktualisiert", `Deine Meldung #${r.id} ist jetzt '${next}'.`);
        }
        if (notifyOnStatus) {
          const area = r.location?.area?.toLowerCase();
          const zip = r.location?.zip;
          const hit =
            subscriptions.find((s) => s.type === "area" && s.value.toLowerCase() === (area || "")) ||
            subscriptions.find((s) => s.type === "zip" && s.value === zip);
          if (hit) notify("Status geändert", `#${r.id}: ${prevStatus} → ${next} (${r.location?.area || REGION_NAME})`);
        }
        return updated;
      })
    );
  };

  const handleVote = (id) => {
    const voter = currentUser?.id || deviceId;
    if (!voter) return alert("Voting derzeit nicht möglich – kein Nutzer/Device erkannt.");
    setReports((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const already = r.votes?.voters?.includes(voter);
        if (already) return r;
        const votes = { count: (r.votes?.count || 0) + 1, voters: [...(r.votes?.voters || []), voter] };
        return { ...r, votes };
      })
    );
  };

  const approveReport = (id) => {
    if (!(currentUser?.isAdmin || currentUser?.isModerator)) return alert("Nur Admin/Moderator.");
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, approved: true } : r)));
  };
  const rejectReport = (id) => {
    if (!(currentUser?.isAdmin || currentUser?.isModerator)) return alert("Nur Admin/Moderator.");
    if (window.confirm("Ungeprüfte Meldung löschen?")) {
      setReports((prev) => prev.filter((r) => r.id !== id));
    }
  };

  // Weiterleitung ans Amt (Demo)
  const forwardToAuthority = (id, authority = "Bauhof Saalekreis") => {
    if (!(currentUser?.isAdmin || currentUser?.isModerator)) return alert("Nur Admin/Moderator.");
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, forwarded: true, forwardedAt: now(), forwardedTo: authority } : r))
    );
    alert(`Weitergeleitet an ${authority}.`);
  };

  // CSV Export
  const exportCSV = () => {
    if (!currentUser?.isAdmin) return alert("Nur Admins können exportieren.");
    const getAt = (hist, key) => hist?.find((h) => h.status === key)?.at || "";
    const headers = [
      "id",
      "category",
      "description",
      "status",
      "approved",
      "createdAt",
      "acceptedAt",
      "doneAt",
      "lat",
      "lng",
      "area",
      "zip",
      "votes",
      "reporterId",
      "forwarded",
      "forwardedAt",
      "forwardedTo",
    ];
    const rows = reports.map((r) => [
      r.id,
      r.category,
      (r.description || "").replace(/\n/g, " ").replace(/"/g, "'"),
      r.status,
      r.approved ? 1 : 0,
      r.createdAt || "",
      getAt(r.statusHistory, "angenommen"),
      getAt(r.statusHistory, "erledigt"),
      r.location?.lat ?? "",
      r.location?.lng ?? "",
      r.location?.area ?? "",
      r.location?.zip ?? "",
      r.votes?.count ?? 0,
      r.reporterId ?? "",
      r.forwarded ? 1 : 0,
      r.forwardedAt || "",
      r.forwardedTo || "",
    ]);
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `stadtmeldung_${REGION_NAME.toLowerCase()}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const mapCenter = location ? [location.lat, location.lng] : [REGION_CENTER.lat, REGION_CENTER.lng];

  // Derived list
  const normalized = (s) => (s || "").toLowerCase();
  let derived = reports
    .filter((r) => (adminMode ? true : r.approved))
    .filter((r) => (showUnapproved ? true : r.approved || !adminMode))
    .filter((r) => (statusFilter === "alle" ? true : r.status === statusFilter))
    .filter((r) => (categoryFilter === "alle" ? true : r.category === categoryFilter))
    .filter((r) => (areaFilter === "alle" ? true : (r.location?.area || "").toLowerCase() === areaFilter.toLowerCase()))
    .filter((r) => {
      const q = normalized(query);
      if (!q) return true;
      return (
        normalized(r.category).includes(q) ||
        normalized(r.description).includes(q) ||
        (r.location && `${r.location.lat},${r.location.lng}`.includes(q)) ||
        normalized(r.location?.area || "").includes(q) ||
        (r.location?.zip || "").includes(q)
      );
    });
  if (onlyMine && currentUser) {
    derived = derived.filter((r) => r.reporterId && r.reporterId === currentUser.id);
  }
  const filteredReports = derived.sort((a, b) => (sortBy === "neueste" ? b.id - a.id : a.id - b.id));

  const counts = useMemo(
    () => ({
      total: reports.length,
      approved: reports.filter((r) => r.approved).length,
      unapproved: reports.filter((r) => !r.approved).length,
      gemeldet: reports.filter((r) => r.status === "gemeldet").length,
      angenommen: reports.filter((r) => r.status === "angenommen").length,
      erledigt: reports.filter((r) => r.status === "erledigt").length,
      votes: reports.reduce((acc, r) => acc + (r.votes?.count || 0), 0),
    }),
    [reports]
  );

  const kpis = useMemo(() => {
    const toAccepted = [];
    const toDone = [];
    const nowTs = now();
    const isInLast = (ms) => (ts) => ts && nowTs - ts <= ms;
    let last7 = 0,
      last30 = 0;
    const perDay = {};
    for (const r of reports) {
      const hist = r.statusHistory || [];
      const created = hist.find((h) => h.status === "gemeldet")?.at;
      const accepted = hist.find((h) => h.status === "angenommen")?.at;
      const done = hist.find((h) => h.status === "erledigt")?.at;
      if (created && accepted) toAccepted.push((accepted - created) / 60000);
      if (created && done) toDone.push((done - created) / 60000);
      if (isInLast(7 * 24 * 60 * 60 * 1000)(created)) last7++;
      if (isInLast(30 * 24 * 60 * 60 * 1000)(created)) last30++;
      if (created) {
        const d = new Date(created).toISOString().slice(0, 10);
        perDay[d] = (perDay[d] || 0) + 1;
      }
    }
    const avg = (arr) => (arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0);
    const topArea =
      Object.entries(
        reports.reduce(
          (m, r) => ((m[r.location?.area || REGION_NAME] = (m[r.location?.area || REGION_NAME] || 0) + 1), m),
          {}
        )
      ).sort((a, b) => b[1] - a[1])[0]?.[0];

    const trendData = Object.entries(perDay)
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([date, count]) => ({ date, count }));
    const byCategory = Object.entries(
      reports.reduce((m, r) => ((m[r.category] = (m[r.category] || 0) + 1), m), {})
    ).map(([category, count]) => ({ category, count }));
    const byStatus = Object.entries(
      reports.reduce((m, r) => ((m[r.status] = (m[r.status] || 0) + 1), m), {})
    ).map(([status, count]) => ({ status, count }));

    return {
      avgToAcceptedMin: avg(toAccepted),
      avgToDoneMin: avg(toDone),
      topArea: topArea || "—",
      createdLast7: last7,
      createdLast30: last30,
      trendData,
      byCategory,
      byStatus,
    };
  }, [reports]);

  // Subscriptions helpers
  const [subInput, setSubInput] = useState("");
  const addSubscription = (type) => {
    const value = (subInput || "").trim();
    if (!value) return;
    const key = type === "area" ? value.toLowerCase() : value;
    if (subscriptions.some((s) => s.type === type && s.value.toLowerCase() === key.toLowerCase())) return;
    setSubscriptions((prev) => [...prev, { type, value }]);
    setSubInput("");
  };
  const removeSubscription = (idx) => setSubscriptions((prev) => prev.filter((_, i) => i !== idx));

  // Legal modals
  const [showImpressum, setShowImpressum] = useState(false);
  const [showDatenschutz, setShowDatenschutz] = useState(false);

  return (
    <div className="p-6 grid gap-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold text-blue-600">
            StadtMeldung <span className="text-gray-800">{REGION_NAME}</span>
          </h1>
          <p className="text-gray-500">Melde. Verfolge. Verändere deinen Landkreis.</p>
        </div>

        <div className="flex items-center gap-2 justify-center">
          {currentUser ? (
            <>
              <span className="px-3 py-1 rounded bg-gray-100 flex items-center gap-2">
                <UserIcon size={16} /> {currentUser.name}{" "}
                {(currentUser.isAdmin || currentUser.isModerator) && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs text-blue-700">
                    <ShieldIcon size={14} /> {currentUser.isAdmin ? "Admin" : "Moderator"}
                  </span>
                )}
              </span>
              {(currentUser.isAdmin || currentUser.isModerator) && (
                <Button variant="outline" onClick={() => setAdminMode((v) => !v)}>
                  <Icon>
                    <FilterIcon size={16} />
                  </Icon>
                  {adminMode ? "Moderation: AN" : "Moderation: AUS"}
                </Button>
              )}
              <Button variant="secondary" onClick={() => Notification?.requestPermission?.()}>
                <Icon>
                  <BellIcon size={16} />
                </Icon>
                Benachrichtigungen
              </Button>
              <Button variant="secondary" onClick={() => setUseLiveGeocode((v) => !v)}>
                <Icon>
                  <GlobeIcon size={16} />
                </Icon>
                {useLiveGeocode ? "Live-Geocoder: AN" : "Live-Geocoder: AUS"}
              </Button>
              <Button variant="secondary" onClick={() => setCurrentUser(null)}>
                <Icon>
                  <LogOutIcon size={16} />
                </Icon>
                Logout
              </Button>
              {currentUser.isAdmin && (
                <Button className="bg-blue-600 text-white" onClick={exportCSV}>
                  <Icon>
                    <DownloadIcon size={16} />
                  </Icon>
                  CSV Export
                </Button>
              )}
            </>
          ) : (
            <AuthInline onLogin={(name, isAdmin, isModerator) => setCurrentUser({ id: uid(), name, isAdmin, isModerator })} />
          )}
        </div>
      </header>

      {/* Hero */}
      <HeroSection region={REGION_NAME} />

      {/* Create Report */}
      <Card className="p-4">
        <CardContent className="grid gap-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Kategorie wählen" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Suche in Beschreibung/Kategorie/Ort/PLZ..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <Textarea
            placeholder={`Beschreibung eingeben (z. B. genaue Lage in ${REGION_NAME})`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="grid md:grid-cols-4 gap-2 items-center">
            <Input type="file" accept="image/*" onChange={handleImageChange} />

            <Button onClick={handleSetDummyLocation}>
              <Icon>
                <MapPinIcon size={16} />
              </Icon>
              Standort: {REGION_CENTER.area}
            </Button>

            <div className="flex gap-2">
              <Input
                placeholder={`Adresse/Stadtteil in ${REGION_NAME} (Demo oder Live)`}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <Button variant="outline" onClick={handleGeocode}>
                <Icon>
                  <MapIcon size={16} />
                </Icon>
                {useLiveGeocode ? "Geocode (Live)" : "Geocode (Demo)"}
              </Button>
            </div>

            {/* Rechts-Hinweis */}
            <LegalImagesNotice />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
            Anonym melden
          </label>

          <div className="flex items-center justify-between gap-2">
            <small className="text-gray-500">
              Gefiltert: {filteredReports.length} / {counts.total} · Geprüft: {counts.approved} · Offen: {counts.unapproved} · 7d:{" "}
              {kpis.createdLast7} · 30d: {kpis.createdLast30}
            </small>
            <div className="flex items-center gap-2">
              {currentUser && (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} /> Nur meine Meldungen
                </label>
              )}
              {(currentUser?.isAdmin || currentUser?.isModerator) && (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={showUnapproved} onChange={(e) => setShowUnapproved(e.target.checked)} /> Ungeprüfte
                  anzeigen
                </label>
              )}

              <Select value={areaFilter} onValueChange={setAreaFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Ort/Stadtteil filtern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle Orte</SelectItem>
                  {Object.values(DEMO_GEOCODER).map((g) => (
                    <SelectItem key={g.area} value={g.area}>
                      {g.area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status filtern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle Stati</SelectItem>
                  <SelectItem value="gemeldet">Gemeldet</SelectItem>
                  <SelectItem value="angenommen">Angenommen</SelectItem>
                  <SelectItem value="erledigt">Erledigt</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Kategorie filtern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle Kategorien</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sortierung" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="neueste">Neueste zuerst</SelectItem>
                  <SelectItem value="älteste">Älteste zuerst</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="bg-blue-600 text-white" onClick={handleSubmit}>
              <Icon>
                <CheckCircleIcon size={16} />
              </Icon>
              Meldung absenden ({REGION_NAME})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions */}
      <Card className="p-4">
        <CardContent className="grid gap-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Icon>
              <BookmarkIcon size={16} />
            </Icon>
            Gebiets-Subscriptions ({REGION_NAME})
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-2 items-center">
              <Input placeholder="Ort oder PLZ" value={subInput} onChange={(e) => setSubInput(e.target.value)} className="w-64" />
              <Button variant="outline" onClick={() => addSubscription("area")}>
                <Icon>
                  <PlusIcon size={16} />
                </Icon>
                Ort
              </Button>
              <Button variant="outline" onClick={() => addSubscription("zip")}>
                <Icon>
                  <PlusIcon size={16} />
                </Icon>
                PLZ
              </Button>
            </div>
            <label className="flex items-center gap-2 text-sm ml-auto">
              <input type="checkbox" checked={notifyOnStatus} onChange={(e) => setNotifyOnStatus(e.target.checked)} /> Auch bei{" "}
              <b>Statusänderungen</b> benachrichtigen
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {subscriptions.map((s, i) => (
              <span key={`${s.type}-${s.value}-${i}`} className="px-2 py-1 bg-gray-100 rounded text-sm flex items-center gap-2">
                {s.type}: <strong>{s.value}</strong>
                <button className="text-gray-500 hover:text-gray-800" onClick={() => removeSubscription(i)}>
                  ×
                </button>
              </span>
            ))}
            {subscriptions.length === 0 && <span className="text-sm text-gray-500">Keine Subscriptions hinzugefügt.</span>}
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <div className="h-96 w-full rounded-xl overflow-hidden">
        <MapContainer center={mapCenter} zoom={12} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          <MapClickSetter setLocation={setLocation} />

          {location && (
            <Marker position={[location.lat, location.lng]}>
              <Popup>Aktueller Meldungsort (klicke auf die Karte, um ihn zu ändern)</Popup>
            </Marker>
          )}

          {filteredReports.map((r) =>
            r.location ? (
              <Marker key={r.id} position={[r.location.lat, r.location.lng]}>
                <Popup>
                  <strong>{r.category.toUpperCase()}</strong>
                  <br />
                  {r.description}
                  {r.image && <img src={r.image} alt="Upload" className="rounded mt-2 w-36" />}
                  <br />
                  Status: {r.status}
                  <br />
                  Votes: {r.votes?.count ?? 0}
                  <br />
                  {r.approved ? "Geprüft" : "Ungeprüft"}
                  <br />
                  Ort: {r.location?.area || "—"} · PLZ {r.location?.zip || "—"}
                </Popup>
              </Marker>
            ) : null
          )}
        </MapContainer>
      </div>

      {/* Admin-Bereich */}
      {(currentUser?.isAdmin || currentUser?.isModerator) && adminMode && (
        <div className="grid gap-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4">
              <CardContent className="grid gap-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Icon>
                    <FilterIcon size={16} />
                  </Icon>
                  Moderation (ungeprüft)
                </h3>
                {reports
                  .filter((r) => !r.approved)
                  .map((r) => (
                    <div key={r.id} className="border rounded p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          #{r.id} · {r.category} · {r.location?.area || "—"} ({r.location?.zip || "—"})
                        </div>
                        <div className="text-sm text-gray-600">{r.description}</div>
                        {r.forwarded && (
                          <div className="text-xs text-blue-700 mt-1">
                            Weitergeleitet an {r.forwardedTo} · {formatTs(r.forwardedAt)}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => approveReport(r.id)}>
                          <Icon>
                            <ApproveIcon size={16} />
                          </Icon>
                          Freigeben
                        </Button>
                        <Button variant="outline" onClick={() => forwardToAuthority(r.id)}>
                          <Icon>
                            <SendIcon size={16} />
                          </Icon>
                          Weiterleiten
                        </Button>
                        <Button variant="destructive" onClick={() => rejectReport(r.id)}>
                          <Icon>
                            <RejectIcon size={16} />
                          </Icon>
                          Verwerfen
                        </Button>
                      </div>
                    </div>
                  ))}
                {reports.filter((r) => !r.approved).length === 0 && (
                  <p className="text-sm text-gray-500">Keine ungeprüften Meldungen.</p>
                )}
              </CardContent>
            </Card>

            <Card className="p-4">
              <CardContent className="grid gap-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Icon>
                    <ChartIcon size={16} />
                  </Icon>
                  Kennzahlen ({REGION_NAME})
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    Gesamt: <strong>{counts.total}</strong>
                  </div>
                  <div>
                    Geprüft: <strong>{counts.approved}</strong>
                  </div>
                  <div>
                    Ungeprüft: <strong>{counts.unapproved}</strong>
                  </div>
                  <div>
                    Gemeldet: <strong>{counts.gemeldet}</strong>
                  </div>
                  <div>
                    Angenommen: <strong>{counts.angenommen}</strong>
                  </div>
                  <div>
                    Erledigt: <strong>{counts.erledigt}</strong>
                  </div>
                  <div>
                    Summe Votes: <strong>{counts.votes}</strong>
                  </div>
                  <div>
                    Top Ort: <strong>{kpis.topArea}</strong>
                  </div>
                </div>
                <div className="text-sm">
                  Ø bis angenommen: <strong>{kpis.avgToAcceptedMin}</strong> Min
                  <br />
                  Ø bis erledigt: <strong>{kpis.avgToDoneMin}</strong> Min
                  <br />
                  Neue Meldungen: <strong>7d {kpis.createdLast7}</strong> · <strong>30d {kpis.createdLast30}</strong>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-4">
              <CardContent className="h-64">
                <h4 className="font-semibold mb-2">Meldungen je Tag</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={kpis.trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" name="Meldungen" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="p-4">
              <CardContent className="h-64">
                <h4 className="font-semibold mb-2">Nach Kategorie</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={kpis.byCategory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Anzahl" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="p-4">
              <CardContent className="h-64">
                <h4 className="font-semibold mb-2">Statusverteilung</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={kpis.byStatus}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Anzahl" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Liste */}
      <div className="grid gap-4">
        {filteredReports.map((r) => (
          <Card key={r.id} className={`p-4 border-l-4 ${r.approved ? "border-blue-600" : "border-amber-500"}`}>
            <CardContent className="grid gap-2">
              <div className="flex items-center justify-between">
                <p className="font-semibold flex items-center gap-2">
                  {r.category.toUpperCase()} {r.approved ? "" : "· ungeprüft"}
                </p>
                <span className="text-xs text-gray-500">ID: {r.id}</span>
              </div>
              <p>{r.description}</p>
              {r.image && <img src={r.image} alt="Upload" className="rounded-xl w-32" />}
              {r.location && (
                <p className="text-sm text-gray-500">
                  {r.location.area || "—"} · PLZ {r.location.zip || "—"} · Lat {r.location.lat.toFixed(5)}, Lng{" "}
                  {r.location.lng.toFixed(5)}
                </p>
              )}

              {/* Timeline */}
              <div className="text-xs text-gray-600 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <ClockIcon size={14} />
                  Gemeldet: <span className="font-medium">{formatTs((r.statusHistory || []).find((h) => h.status === "gemeldet")?.at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon size={14} />
                  Angenommen:{" "}
                  <span className="font-medium">{formatTs((r.statusHistory || []).find((h) => h.status === "angenommen")?.at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon size={14} />
                  Erledigt: <span className="font-medium">{formatTs((r.statusHistory || []).find((h) => h.status === "erledigt")?.at)}</span>
                </div>
                {r.forwarded && (
                  <div className="flex items-center gap-2 text-blue-700">
                    <SendIcon size={14} />
                    Weitergeleitet: <span className="font-medium">{r.forwardedTo || "Amt"} · {formatTs(r.forwardedAt)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-green-600">Status: {r.status}</span>
                <span className="text-sm">Votes: {r.votes?.count ?? 0}</span>
                <Button variant="secondary" onClick={() => handleVote(r.id)}>
                  <Icon>
                    <ThumbsUpIcon size={16} />
                  </Icon>
                  Upvote
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange(r.id)}
                  disabled={
                    !(
                      currentUser?.isAdmin ||
                      currentUser?.isModerator ||
                      (currentUser && r.reporterId === currentUser.id)
                    )
                  }
                >
                  <Icon>
                    <RefreshCcwIcon size={16} />
                  </Icon>
                  Status ändern
                </Button>
                <Button variant="destructive" onClick={() => handleDelete(r.id)}>
                  <Icon>
                    <Trash2Icon size={16} />
                  </Icon>
                  Löschen
                </Button>
                {(currentUser?.isAdmin || currentUser?.isModerator) && !r.approved && (
                  <>
                    <Button variant="outline" onClick={() => approveReport(r.id)}>
                      <Icon>
                        <ApproveIcon size={16} />
                      </Icon>
                      Freigeben
                    </Button>
                    <Button variant="outline" onClick={() => forwardToAuthority(r.id)}>
                      <Icon>
                        <SendIcon size={16} />
                      </Icon>
                      Weiterleiten
                    </Button>
                    <Button variant="destructive" onClick={() => rejectReport(r.id)}>
                      <Icon>
                        <RejectIcon size={16} />
                      </Icon>
                      Verwerfen
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredReports.length === 0 && <p className="text-center text-gray-500">Keine Meldungen entsprechen den aktuellen Filtern/Suche.</p>}
      </div>

      {/* Forum */}
      <Card className="p-4">
        <CardContent>
          <ForumBoard currentUser={currentUser} />
        </CardContent>
      </Card>

      {/* Footer + Rechtliches */}
      <footer className="text-xs text-gray-500 text-center py-6">
        <button className="underline" onClick={() => setShowImpressum(true)}>
          <Icon>
            <InfoIcon size={12} />
          </Icon>
          Impressum
        </button>
        <span className="mx-2">·</span>
        <button className="underline" onClick={() => setShowDatenschutz(true)}>Datenschutz</button>
      </footer>

      {showImpressum && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6" onClick={() => setShowImpressum(false)}>
          <div className="bg-white rounded-xl p-4 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-2">Impressum (Demo)</h3>
            <p>
              StadtMeldung {REGION_NAME} – Diese Seite ist ein Prototyp zu Testzwecken. Kein offizieller Auftritt des Landkreises.
            </p>
            <p className="text-xs text-gray-500 mt-2">Angaben ohne Gewähr.</p>
            <div className="text-right mt-3">
              <Button variant="outline" onClick={() => setShowImpressum(false)}>Schließen</Button>
            </div>
          </div>
        </div>
      )}

      {showDatenschutz && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6" onClick={() => setShowDatenschutz(false)}>
          <div className="bg-white rounded-xl p-4 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-2">Datenschutz (Demo)</h3>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>Ohne Login: Meldungen sind anonym.</li>
              <li>Mit Login: Wir speichern deine ID lokal (Demo) zur Zuordnung von Votes/Meldungen.</li>
              <li>Geocoding über Nominatim (optional) – es gelten deren Nutzungsbedingungen.</li>
            </ul>
            <div className="text-right mt-3">
              <Button variant="outline" onClick={() => setShowDatenschutz(false)}>Schließen</Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat */}
      <ChatWidget />
    </div>
  );
}

// Inline-Auth (Demo)
function AuthInline({ onLogin }) {
  const [name, setName] = useState("");
  const [asAdmin, setAsAdmin] = useState(false);
  const [asModerator, setAsModerator] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="w-36" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={asAdmin} onChange={(e) => setAsAdmin(e.target.checked)} />
        Admin (Demo)
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={asModerator} onChange={(e) => setAsModerator(e.target.checked)} />
        Moderator (Demo)
      </label>
      <Button onClick={() => onLogin(name || "Gast", asAdmin, asModerator)}>
        <Icon>
          <LogInIcon size={16} />
        </Icon>
        Login
      </Button>
    </div>
  );
}

