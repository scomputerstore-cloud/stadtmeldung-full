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
  ico
