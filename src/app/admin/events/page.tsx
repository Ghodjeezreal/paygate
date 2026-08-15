"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Plus, Ticket, ArrowLeft } from "lucide-react";

interface TicketTypeDraft {
  id: string;
  name: string;
  price: string;
  quantity: string;
}

type EventTypeOption = 'funeral' | 'birthday' | 'corporate' | 'general';

interface EventItem {
  id: string;
  title: string;
  description: string;
  venue: string;
  date: string;
  image: string;
  colors?: string[];
  circleOptions?: string[];
  color?: string;
  shareSlug?: string;
  status: string;
  eventType?: EventTypeOption;
  heroHeading?: string;
  heroSubheading?: string;
  heroAge?: string;
  heroHeadingFont?: string;
  heroSubheadingFont?: string;
  heroAgeFont?: string;
  heroText?: string;
  invitationMessage?: string;
  dressCode?: string;
  admits?: string;
  venueNote?: string;
  familyNote?: string;
  ctaText?: string;
  isTicketless?: boolean;
  ticketTypes: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}

const emptyTicketType = (): TicketTypeDraft => ({
  id: "general",
  name: "General",
  price: "0",
  quantity: "100",
});

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    venue: "",
    date: "",
    image: "",
    colors: ["#c8a047"],
    circleOptions: ["Family", "Friends of the Family", "Church Family"],
    shareSlug: "",
    eventType: "general" as EventTypeOption,
    heroHeading: "",
    heroSubheading: "",
    heroAge: "",
    heroHeadingFont: "Georgia",
    heroSubheadingFont: "Georgia",
    heroAgeFont: "Georgia",
    heroText: "",
    invitationMessage: "",
    dressCode: "",
    admits: "",
    venueNote: "",
    familyNote: "",
    ctaText: "",
  });
  const [isTicketless, setIsTicketless] = useState(false);
  const [ticketTypes, setTicketTypes] = useState<TicketTypeDraft[]>([emptyTicketType()]);

  const updateColor = (index: number, value: string) => {
    setFormData((current) => {
      const nextColors = [...current.colors];
      nextColors[index] = value;
      return { ...current, colors: nextColors };
    });
  };

  const addColor = () => {
    setFormData((current) => ({
      ...current,
      colors: current.colors.length >= 3 ? current.colors : [...current.colors, '#c8a047'],
    }));
  };

  const removeColor = (index: number) => {
    setFormData((current) => ({
      ...current,
      colors: current.colors.length <= 1 ? current.colors : current.colors.filter((_, colorIndex) => colorIndex !== index),
    }));
  };

  const updateCircleOption = (index: number, value: string) => {
    setFormData((current) => {
      const nextCircleOptions = [...current.circleOptions];
      nextCircleOptions[index] = value;
      return { ...current, circleOptions: nextCircleOptions };
    });
  };

  const addCircleOption = () => {
    setFormData((current) => ({
      ...current,
      circleOptions: [...current.circleOptions, 'New circle group'],
    }));
  };

  const removeCircleOption = (index: number) => {
    setFormData((current) => ({
      ...current,
      circleOptions: current.circleOptions.length <= 1 ? current.circleOptions : current.circleOptions.filter((_, optionIndex) => optionIndex !== index),
    }));
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await fetch("/api/events");
      const data = await response.json();
      setEvents(data.events || []);
    } finally {
      setLoading(false);
    }
  };

  const updateTicketType = (index: number, field: keyof TicketTypeDraft, value: string) => {
    setTicketTypes((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)));
  };

  const addTicketType = () => {
    setTicketTypes((current) => [...current, { id: `type-${current.length + 1}`, name: "VIP", price: "0", quantity: "50" }]);
  };

  const removeTicketType = (index: number) => {
    setTicketTypes((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const isEditing = Boolean(editingId);
      const endpoint = isEditing ? `/api/events/${editingId}` : "/api/events";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          colors: formData.colors.length ? formData.colors : ['#c8a047'],
          circleOptions: formData.circleOptions.length ? formData.circleOptions : ['Family', 'Friends of the Family', 'Church Family'],
          shareSlug: formData.shareSlug,
          eventType: formData.eventType,
          isTicketless,
          ticketTypes: isTicketless ? [] : ticketTypes.map((type) => ({
            id: type.id.trim(),
            name: type.name.trim(),
            price: Number(type.price),
            quantity: Number(type.quantity),
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${isEditing ? "update" : "create"} event`);
      }

      setMessage(isEditing ? "Event updated successfully." : "Event created successfully.");
      setFormData({ title: "", description: "", venue: "", date: "", image: "", colors: ["#c8a047"], circleOptions: ["Family", "Friends of the Family", "Church Family"], shareSlug: "", eventType: "general", heroHeading: "", heroSubheading: "", heroAge: "", heroHeadingFont: "Georgia", heroSubheadingFont: "Georgia", heroAgeFont: "Georgia", heroText: "", invitationMessage: "", dressCode: "", admits: "", venueNote: "", familyNote: "", ctaText: "" });
      setIsTicketless(false);
      setTicketTypes([emptyTicketType()]);
      setEditingId(null);
      await loadEvents();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save event");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (eventItem: EventItem) => {
    setEditingId(eventItem.id);
    setMessage("");
    setFormData({
      title: eventItem.title,
      description: eventItem.description,
      venue: eventItem.venue,
      date: new Date(eventItem.date).toISOString().slice(0, 16),
      image: eventItem.image || "",
      colors: Array.isArray(eventItem.colors) && eventItem.colors.length ? eventItem.colors : [eventItem.color || "#c8a047"],
      circleOptions: Array.isArray(eventItem.circleOptions) && eventItem.circleOptions.length ? eventItem.circleOptions : ["Family", "Friends of the Family", "Church Family"],
      shareSlug: eventItem.shareSlug || "",
      eventType: eventItem.eventType || "general",
      heroHeading: eventItem.heroHeading || "",
      heroSubheading: eventItem.heroSubheading || "",
      heroAge: eventItem.heroAge || "",
      heroHeadingFont: eventItem.heroHeadingFont || "Georgia",
      heroSubheadingFont: eventItem.heroSubheadingFont || "Georgia",
      heroAgeFont: eventItem.heroAgeFont || "Georgia",
      heroText: eventItem.heroText || "",
      invitationMessage: eventItem.invitationMessage || "",
      dressCode: eventItem.dressCode || "",
      admits: eventItem.admits || "",
      venueNote: eventItem.venueNote || "",
      familyNote: eventItem.familyNote || "",
      ctaText: eventItem.ctaText || "",
    });
    setIsTicketless(Boolean(eventItem.isTicketless || eventItem.ticketTypes.length === 0));
    setTicketTypes(
      eventItem.ticketTypes.map((type) => ({
        id: type.id,
        name: type.name,
        price: String(type.price),
        quantity: String(type.quantity),
      }))
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setMessage("");
    setFormData({ title: "", description: "", venue: "", date: "", image: "", colors: ["#c8a047"], circleOptions: ["Family", "Friends of the Family", "Church Family"], shareSlug: "", eventType: "general", heroHeading: "", heroSubheading: "", heroAge: "", heroHeadingFont: "Georgia", heroSubheadingFont: "Georgia", heroAgeFont: "Georgia", heroText: "", invitationMessage: "", dressCode: "", admits: "", venueNote: "", familyNote: "", ctaText: "" });
    setIsTicketless(false);
    setTicketTypes([emptyTicketType()]);
  };

  const handleDelete = async (eventItem: EventItem) => {
    const approved = window.confirm(`Delete event \"${eventItem.title}\"?`);
    if (!approved) {
      return;
    }

    setDeletingId(eventItem.id);
    setMessage("");
    try {
      const response = await fetch(`/api/events/${eventItem.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete event");
      }

      if (editingId === eventItem.id) {
        cancelEdit();
      }

      setMessage("Event deleted successfully.");
      await loadEvents();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to delete event");
    } finally {
      setDeletingId(null);
    }
  };

  const copyShareLink = async (eventItem: EventItem) => {
    const shareTarget = eventItem.shareSlug || eventItem.id;
    const shareUrl = `${window.location.origin}/events/${shareTarget}${eventItem.shareSlug ? '?share=1' : ''}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setMessage("Registration link copied for this event.");
    } catch (error) {
      console.error("Failed to copy event share link:", error);
      setMessage(`Copy this registration link: ${shareUrl}`);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
      <Header showBackButton={true} />
      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 700, margin: "0 0 8px" }}>Event Management</h1>
            <p style={{ color: "#6b7280", margin: 0 }}>Create events and define ticket types for the ticketing flow.</p>
          </div>
          <Link href="/admin" style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderRadius: "10px", backgroundColor: "white", border: "1px solid #e5e7eb", textDecoration: "none", color: "#374151", fontWeight: 600 }}>
            <ArrowLeft style={{ width: 16, height: 16 }} />
            Back to Admin
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
          <section style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 4px 10px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div style={{ backgroundColor: "#dbeafe", borderRadius: "12px", padding: "10px", display: "flex" }}>
                <Plus style={{ width: 20, height: 20, color: "#2563eb" }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "20px" }}>{editingId ? "Edit Event" : "Create Event"}</h2>
                <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>{editingId ? "Update event details and ticket types." : "Publish a new event to the public events list."}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "12px" }}>
              <input required placeholder="Event title" value={formData.title} onChange={(e) => setFormData((current) => ({ ...current, title: e.target.value }))} style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #d1d5db" }} />
              <select value={formData.eventType} onChange={(e) => setFormData((current) => ({ ...current, eventType: e.target.value as EventTypeOption }))} style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #d1d5db" }}>
                <option value="general">General</option>
                <option value="funeral">Funeral / memorial</option>
                <option value="birthday">Birthday</option>
                <option value="corporate">Corporate event</option>
              </select>
              <input placeholder="Main heading" value={formData.heroHeading} onChange={(e) => setFormData((current) => ({ ...current, heroHeading: e.target.value }))} style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #d1d5db" }} />
              <select value={formData.heroHeadingFont} onChange={(e) => setFormData((current) => ({ ...current, heroHeadingFont: e.target.value }))} style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #d1d5db" }}>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Arial">Arial</option>
                <option value="Verdana">Verdana</option>
                <option value="Trebuchet MS">Trebuchet MS</option>
                <option value="Courier New">Courier New</option>
              </select>
              <input placeholder="Sub heading" value={formData.heroSubheading} onChange={(e) => setFormData((current) => ({ ...current, heroSubheading: e.target.value }))} style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #d1d5db" }} />
              <select value={formData.heroSubheadingFont} onChange={(e) => setFormData((current) => ({ ...current, heroSubheadingFont: e.target.value }))} style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #d1d5db" }}>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Arial">Arial</option>
                <option value="Verdana">Verdana</option>
                <option value="Trebuchet MS">Trebuchet MS</option>
                <option value="Courier New">Courier New</option>
              </select>
              <input placeholder="Big number / age" value={formData.heroAge} onChange={(e) => setFormData((current) => ({ ...current, heroAge: e.target.value }))} style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #d1d5db" }} />
              <select value={formData.heroAgeFont} onChange={(e) => setFormData((current) => ({ ...current, heroAgeFont: e.target.value }))} style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #d1d5db" }}>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Arial">Arial</option>
                <option value="Verdana">Verdana</option>
                <option value="Trebuchet MS">Trebuchet MS</option>
                <option value="Courier New">Courier New</option>
              </select>
              <textarea required placeholder="Event description" value={formData.description} onChange={(e) => setFormData((current) => ({ ...current, description: e.target.value }))} rows={4} style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #d1d5db", resize: "vertical" }} />
              <input required placeholder="Venue" value={formData.venue} onChange={(e) => setFormData((current) => ({ ...current, venue: e.target.value }))} style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #d1d5db" }} />
              <input required type="datetime-local" value={formData.date} onChange={(e) => setFormData((current) => ({ ...current, date: e.target.value }))} style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #d1d5db" }} />
              <input placeholder="Image path (optional)" value={formData.image} onChange={(e) => setFormData((current) => ({ ...current, image: e.target.value }))} style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #d1d5db" }} />
              <input placeholder="Custom share slug (optional, e.g. memorial-2026)" value={formData.shareSlug} onChange={(e) => setFormData((current) => ({ ...current, shareSlug: e.target.value }))} style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #d1d5db" }} />
              <div style={{ display: "grid", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                  <span style={{ fontWeight: 600, color: "#374151" }}>Event colours</span>
                  {formData.colors.length < 3 && (
                    <button type="button" onClick={addColor} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #bfdbfe", backgroundColor: "#eff6ff", color: "#1d4ed8", fontWeight: 600, cursor: "pointer" }}>
                      Add colour
                    </button>
                  )}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                  {formData.colors.map((color, index) => (
                    <div key={`color-${index}`} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "10px", backgroundColor: "#fafafa" }}>
                      <input type="color" value={color} onChange={(e) => updateColor(index, e.target.value)} style={{ width: "40px", height: "40px", border: "none", borderRadius: "8px", padding: 0, background: "transparent" }} />
                      <span style={{ fontSize: "12px", fontFamily: "monospace", color: "#4b5563" }}>{color}</span>
                      {formData.colors.length > 1 && (
                        <button type="button" onClick={() => removeColor(index)} style={{ border: "none", background: "transparent", color: "#dc2626", fontWeight: 700, cursor: "pointer" }} aria-label="Remove colour">
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                  <span style={{ fontWeight: 600, color: "#374151" }}>RSVP circle groups</span>
                  <button type="button" onClick={addCircleOption} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #bfdbfe", backgroundColor: "#eff6ff", color: "#1d4ed8", fontWeight: 600, cursor: "pointer" }}>
                    Add circle group
                  </button>
                </div>
                <div style={{ display: "grid", gap: "8px" }}>
                  {formData.circleOptions.map((option, index) => (
                    <div key={`circle-option-${index}`} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input value={option} onChange={(e) => updateCircleOption(index, e.target.value)} placeholder="Circle option" style={{ flex: 1, padding: "12px 14px", borderRadius: "10px", border: "1px solid #d1d5db" }} />
                      {formData.circleOptions.length > 1 && (
                        <button type="button" onClick={() => removeCircleOption(index)} style={{ border: "none", background: "transparent", color: "#dc2626", fontWeight: 700, cursor: "pointer" }} aria-label="Remove option">
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <textarea placeholder="Hero text" value={formData.heroText} onChange={(e) => setFormData((current) => ({ ...current, heroText: e.target.value }))} rows={2} style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #d1d5db", resize: "vertical" }} />
              <textarea placeholder="Invitation message" value={formData.invitationMessage} onChange={(e) => setFormData((current) => ({ ...current, invitationMessage: e.target.value }))} rows={4} style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #d1d5db", resize: "vertical" }} />
              <input placeholder="Dress code" value={formData.dressCode} onChange={(e) => setFormData((current) => ({ ...current, dressCode: e.target.value }))} style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #d1d5db" }} />
              <input placeholder="Admits" value={formData.admits} onChange={(e) => setFormData((current) => ({ ...current, admits: e.target.value }))} style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #d1d5db" }} />
              <input placeholder="Venue note" value={formData.venueNote} onChange={(e) => setFormData((current) => ({ ...current, venueNote: e.target.value }))} style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #d1d5db" }} />
              <input placeholder="Family / host note" value={formData.familyNote} onChange={(e) => setFormData((current) => ({ ...current, familyNote: e.target.value }))} style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #d1d5db" }} />
              <input placeholder="CTA text" value={formData.ctaText} onChange={(e) => setFormData((current) => ({ ...current, ctaText: e.target.value }))} style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #d1d5db" }} />

              <label style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 600, color: "#374151" }}>
                <input type="checkbox" checked={isTicketless} onChange={(e) => setIsTicketless(e.target.checked)} />
                Ticketless funeral / memorial invitation
              </label>

              {!isTicketless && (
                <div style={{ display: "grid", gap: "10px" }}>
                  <div style={{ fontWeight: 600 }}>Ticket Types</div>
                  {ticketTypes.map((ticketType, index) => (
                  <div key={index} style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "10px", display: "grid", gap: "8px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "8px" }}>
                    <input placeholder="Id" value={ticketType.id} onChange={(e) => updateTicketType(index, "id", e.target.value)} style={{ padding: "10px 12px", borderRadius: "10px", border: "1px solid #d1d5db" }} />
                    <input placeholder="Name" value={ticketType.name} onChange={(e) => updateTicketType(index, "name", e.target.value)} style={{ padding: "10px 12px", borderRadius: "10px", border: "1px solid #d1d5db" }} />
                    <input type="number" placeholder="Price" value={ticketType.price} onChange={(e) => updateTicketType(index, "price", e.target.value)} style={{ padding: "10px 12px", borderRadius: "10px", border: "1px solid #d1d5db" }} />
                    <input type="number" placeholder="Qty" value={ticketType.quantity} onChange={(e) => updateTicketType(index, "quantity", e.target.value)} style={{ padding: "10px 12px", borderRadius: "10px", border: "1px solid #d1d5db" }} />
                    </div>
                    {ticketTypes.length > 1 && (
                      <button type="button" onClick={() => removeTicketType(index)} style={{ justifySelf: "flex-start", padding: "8px 12px", borderRadius: "10px", border: "1px solid #fecaca", backgroundColor: "#fff1f2", color: "#dc2626", fontWeight: 600, cursor: "pointer" }}>
                        Remove
                      </button>
                    )}
                    </div>
                  ))}
                  <button type="button" onClick={addTicketType} style={{ justifySelf: "flex-start", padding: "10px 14px", borderRadius: "10px", border: "1px dashed #93c5fd", backgroundColor: "#eff6ff", color: "#2563eb", fontWeight: 600, cursor: "pointer" }}>
                    Add ticket type
                  </button>
                </div>
              )}

              {message && <div style={{ padding: "12px 14px", borderRadius: "10px", backgroundColor: message.includes("success") ? "#ecfdf5" : "#fef2f2", color: message.includes("success") ? "#047857" : "#b91c1c" }}>{message}</div>}

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button type="submit" disabled={submitting} style={{ padding: "14px 16px", borderRadius: "10px", border: "none", backgroundColor: "#2563eb", color: "white", fontWeight: 700, cursor: "pointer" }}>
                  {submitting ? (editingId ? "Saving..." : "Creating...") : (editingId ? "Save Changes" : "Create Event")}
                </button>
                {editingId && (
                  <button type="button" onClick={cancelEdit} style={{ padding: "14px 16px", borderRadius: "10px", border: "1px solid #d1d5db", backgroundColor: "white", color: "#374151", fontWeight: 700, cursor: "pointer" }}>
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </section>

          <section style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 4px 10px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div style={{ backgroundColor: "#dcfce7", borderRadius: "12px", padding: "10px", display: "flex" }}>
                <Ticket style={{ width: 20, height: 20, color: "#16a34a" }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "20px" }}>Published Events</h2>
                <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>{loading ? "Loading events..." : `${events.length} total events`}</p>
              </div>
            </div>

            <div style={{ display: "grid", gap: "12px" }}>
              {events.map((eventItem) => (
                <div key={eventItem.id} style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "6px" }}>
                    <div>
                      <h3 style={{ margin: "0 0 4px", fontSize: "18px" }}>{eventItem.title}</h3>
                      <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>{eventItem.venue}</p>
                    </div>
                    <span style={{ alignSelf: "flex-start", padding: "4px 10px", borderRadius: "999px", backgroundColor: "#eff6ff", color: "#2563eb", fontSize: "12px", fontWeight: 700 }}>
                      {eventItem.status}
                    </span>
                  </div>
                  <p style={{ margin: "0 0 8px", color: "#374151", fontSize: "14px" }}>{eventItem.description}</p>
                  <div style={{ fontSize: "13px", color: "#6b7280" }}>
                    {new Date(eventItem.date).toLocaleString()} • {eventItem.isTicketless || eventItem.ticketTypes.length === 0 ? "Ticketless invitation" : `${eventItem.ticketTypes.length} ticket type(s)`}
                  </div>
                  <div style={{ marginTop: "10px", marginBottom: "8px", padding: "8px 10px", borderRadius: "8px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", color: "#0f172a", fontSize: "12px", wordBreak: "break-all" }}>
                    <strong style={{ color: "#475569" }}>Invite link:</strong> {`${typeof window !== 'undefined' ? window.location.origin : ''}/events/${eventItem.shareSlug || eventItem.id}${eventItem.shareSlug ? '?share=1' : ''}`}
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
                    <button type="button" onClick={() => copyShareLink(eventItem)} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #bbf7d0", backgroundColor: "#ecfdf5", color: "#166534", fontWeight: 600, cursor: "pointer" }}>
                      Copy invite link
                    </button>
                    <button type="button" onClick={() => startEdit(eventItem)} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #bfdbfe", backgroundColor: "#eff6ff", color: "#1d4ed8", fontWeight: 600, cursor: "pointer" }}>
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(eventItem)} disabled={deletingId === eventItem.id} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #fecaca", backgroundColor: "#fff1f2", color: "#b91c1c", fontWeight: 600, cursor: "pointer" }}>
                      {deletingId === eventItem.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}

              {!loading && events.length === 0 && (
                <div style={{ padding: "18px", borderRadius: "12px", backgroundColor: "#f9fafb", color: "#6b7280", textAlign: "center" }}>
                  No events created yet.
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}