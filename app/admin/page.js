"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./admin.module.css";

const emptyProject = { title: "", description: "" };

export default function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(emptyProject);
  const [editing, setEditing] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const fileInput = useRef(null);

  const loadProjects = useCallback(async () => {
    const response = await fetch("/api/projects", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load projects.");
    setProjects(data.projects || []);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/session", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then(async (session) => {
        if (!active) return;
        if (session?.authenticated) {
          setAuthenticated(true);
          try {
            await loadProjects();
          } catch (error) {
            setNotice(error.message);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => { active = false; };
  }, [loadProjects]);

  async function handleLogin(event) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not sign in.");
      setAuthenticated(true);
      setPassword("");
      await loadProjects();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setProjects([]);
    setNotice("");
  }

  function resetForm() {
    setForm(emptyProject);
    setEditing(null);
    setImageFile(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  function startEditing(project) {
    setEditing(project);
    setForm({ title: project.title, description: project.description });
    setImageFile(null);
    if (fileInput.current) fileInput.current.value = "";
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSaveProject(event) {
    event.preventDefault();
    setBusy(true);
    setNotice("");

    try {
      let imageUrl = editing?.imageUrl || "";
      let imagePublicId = editing?.imagePublicId || "";

      if (imageFile) {
        const uploadForm = new FormData();
        uploadForm.append("image", imageFile);
        const uploadResponse = await fetch("/api/admin/upload", {
          method: "POST",
          body: uploadForm,
        });
        const uploadData = await uploadResponse.json();
        if (!uploadResponse.ok) throw new Error(uploadData.error || "Image upload failed.");
        imageUrl = uploadData.imageUrl;
        imagePublicId = uploadData.imagePublicId;
      } else if (!editing) {
        throw new Error("Choose a project photo to upload.");
      }

      const response = await fetch(editing ? `/api/projects/${editing.id}` : "/api/projects", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, imageUrl, imagePublicId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save the project.");

      await loadProjects();
      resetForm();
      setNotice(editing ? "Project updated." : "Project added.");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(project) {
    if (!window.confirm(`Delete “${project.title}”?`)) return;
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not delete the project.");
      await loadProjects();
      if (editing?.id === project.id) resetForm();
      setNotice("Project deleted.");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return <main className={styles.page}><p className={styles.loading}>Checking admin session…</p></main>;
  }

  if (!authenticated) {
    return (
      <main className={styles.page}>
        <form className={styles.loginCard} onSubmit={handleLogin}>
          <Link className={styles.backLink} href="/">← Back to portfolio</Link>
          <p className={styles.kicker}>PRIVATE AREA</p>
          <h1>Admin sign in</h1>
          <p className={styles.subheading}>Sign in to manage portfolio projects.</p>
          <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>
          <button type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
          {notice && <p className={styles.notice} role="alert">{notice}</p>}
        </form>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.dashboardHeader}>
        <div><p className={styles.kicker}>PORTFOLIO ADMIN</p><h1>Projects</h1></div>
        <div className={styles.headerActions}><Link href="/">View site ↗</Link><button type="button" className={styles.secondaryButton} onClick={handleLogout}>Sign out</button></div>
      </header>

      <section className={styles.editor}>
        <h2>{editing ? "Edit project" : "Add a project"}</h2>
        <form onSubmit={handleSaveProject}>
          <label>Project title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} maxLength={100} required /></label>
          <label>Short description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={4} maxLength={2000} required /></label>
          <label>Project photo<input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => setImageFile(event.target.files?.[0] || null)} required={!editing} /></label>
          {editing && !imageFile && <p className={styles.hint}>Leave the photo unchanged, or select a new one to replace it.</p>}
          <div className={styles.formActions}>
            <button type="submit" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Add project"}</button>
            {editing && <button type="button" className={styles.secondaryButton} onClick={resetForm}>Cancel edit</button>}
          </div>
        </form>
        {notice && <p className={styles.notice} role="status">{notice}</p>}
      </section>

      <section className={styles.projectList}>
        <h2>Published projects <span>{projects.length}</span></h2>
        {projects.length === 0 ? <p className={styles.hint}>No projects yet. Add your first project above.</p> : (
          <div className={styles.cards}>
            {projects.map((project) => (
              <article className={styles.card} key={project.id}>
                <div className={styles.thumbnail}><Image src={project.imageUrl} alt="" fill sizes="120px" /></div>
                <div className={styles.cardText}><h3>{project.title}</h3><p>{project.description}</p><div className={styles.cardActions}><button type="button" className={styles.secondaryButton} onClick={() => startEditing(project)}>Edit</button><button type="button" className={styles.deleteButton} onClick={() => handleDelete(project)} disabled={busy}>Delete</button></div></div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

