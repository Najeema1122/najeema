"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./page.module.css";

function getLocalDateTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

export default function Home() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [bookingMessage, setBookingMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/projects", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load projects.");
        if (active) setProjects(data.projects || []);
      })
      .catch((error) => {
        if (active) setProjectsError(error.message);
      })
      .finally(() => {
        if (active) setProjectsLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function handleContactSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    setContactMessage("Sending your message…");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The message could not be sent.");
      setContactMessage("Thank you. Your message has been sent.");
      form.reset();
    } catch (error) {
      setContactMessage(error.message);
    }
  }

  async function handleBookingSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    const selectedTime = new Date(values.preferredDateTime);
    if (selectedTime.getTime() <= Date.now()) {
      setBookingMessage("Please choose a date and time in the future.");
      return;
    }

    setBookingMessage("Sending your meeting request…");
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: values.fullName,
          email: values.bookingEmail,
          preferredDateTime: selectedTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          agenda: values.agenda,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The request could not be sent.");
      const successMessage = "Your meeting request was sent. Please check your email.";
      setBookingMessage(successMessage);
      window.setTimeout(() => {
        setBookingMessage((current) => current === successMessage ? "" : current);
      }, 5000);
      form.reset();
    } catch (error) {
      setBookingMessage(error.message);
    }
  }

  function closeProject() {
    setSelectedProject(null);
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a className={styles.logo} href="#home" aria-label="Najeema, home">
          Najeema<span>.</span>
        </a>

        <nav className={styles.nav} aria-label="Main navigation">
          <a href="#about">About</a>
          <a href="#projects">Projects</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <section className={styles.hero} id="home">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>CALICUT · OPEN TO OPPORTUNITIES</p>
          <h1>
            Hi, I’m <span>Najeema.</span>
          </h1>
          <p className={styles.intro}>
            I’m learning the MERN stack to build modern websites and web
            applications. I enjoy exploring new ideas, improving my skills, and
            turning what I learn into practical projects.
          </p>
          <a className={styles.button} href="#projects">
            See my projects <span aria-hidden="true">↓</span>
          </a>
        </div>

        <div className={styles.portrait}>
          <span className={styles.portraitFallback} aria-hidden="true">N</span>
          <Image
            src="/profile.jpg"
            alt="Portrait of Najeema"
            fill
            priority
            sizes="(max-width: 700px) 80vw, 360px"
            className={styles.portraitImage}
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        </div>
      </section>

      <section className={styles.section} id="about">
        <p className={styles.label}>01 / ABOUT</p>
        <div className={styles.aboutGrid}>
          <h2>A little about me.</h2>
          <div>
            <p>
              I’m an aspiring web developer learning the MERN stack: MongoDB,
              Express, React, and Node.js. I enjoy building projects as I learn
              and figuring out how each part of a website works. I hope to
              create useful, easy-to-use web applications and keep growing
              through hands-on experience.
            </p>
            <div className={styles.details}>
              <strong>Education</strong>
              <span>
                B.Tech. in Computer Science and Engineering · University of
                Calicut · 2016
              </span>
            </div>
            <div className={styles.skills}>
              <strong>Skills I’m learning</strong>
              <span>JavaScript</span>
              <span>React</span>
              <span>HTML &amp; CSS</span>
              <span>Node.js</span>
              <span>MongoDB</span>
              <span>Express</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="projects">
        <p className={styles.label}>02 / PROJECTS</p>
        <div className={styles.sectionHeading}>
          <h2>Selected projects</h2>
          <p>Select a photo to see the project details.</p>
        </div>

        {projectsLoading ? (
          <p className={styles.projectState}>Loading projects…</p>
        ) : projectsError ? (
          <p className={styles.projectState} role="status">{projectsError}</p>
        ) : projects.length === 0 ? (
          <p className={styles.projectState}>No projects have been added yet.</p>
        ) : (
          <div className={styles.projectGrid}>
            {projects.map((project, index) => (
              <article className={styles.projectCard} key={project.id}>
                <button
                  className={styles.projectButton}
                  type="button"
                  onClick={() => setSelectedProject(project)}
                  aria-label={`View ${project.title}`}
                >
                  <span
                    className={`${styles.projectVisual} ${
                      index === 0
                        ? styles.projectVisualOne
                        : index === 1
                          ? styles.projectVisualTwo
                          : styles.projectVisualThree
                    }`}
                  >
                    <span className={styles.projectFallback} aria-hidden="true">
                      PROJECT PHOTO
                    </span>
                    <Image
                      src={project.imageUrl}
                      alt={`Photo of ${project.title}`}
                      fill
                      sizes="(max-width: 700px) 88vw, 33vw"
                      className={styles.projectImage}
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  </span>
                  <span className={styles.projectOpenHint}>Open project ↗</span>
                </button>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className={styles.contact} id="contact">
        <p className={styles.label}>03 / CONTACT</p>
        <div className={styles.contactIntro}>
          <div>
            <h2>Let’s talk.</h2>
            <p>Have a question or an opportunity? I’d be happy to hear from you.</p>
          </div>
          <div className={styles.contactDetails}>
            <a href="mailto:najeemaanas123@gmail.com">
              najeemaanas123@gmail.com
            </a>
            <a href="tel:+918086229987">+91 80862 29987</a>
            <div className={styles.socials}>
              <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer">
                LinkedIn ↗
              </a>
              <a href="https://github.com/Najeema1122" target="_blank" rel="noreferrer">
                GitHub ↗
              </a>
              <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">
                Instagram ↗
              </a>
            </div>
          </div>
        </div>

        <div className={styles.formsGrid}>
          <form className={styles.formCard} onSubmit={handleContactSubmit}>
            <h3>Send me a message</h3>
            <label>
              Name
              <input name="name" type="text" autoComplete="name" required />
            </label>
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </label>
            <label>
              Message
              <textarea name="message" rows={4} required />
            </label>
            <button className={styles.button} type="submit">
              Send message <span aria-hidden="true">↗</span>
            </button>
            {contactMessage && (
              <p className={styles.formStatus} role="status">
                {contactMessage}
              </p>
            )}
          </form>

          <form className={styles.formCard} onSubmit={handleBookingSubmit}>
            <h3>Request a meeting</h3>
            <label>
              Full name
              <input name="fullName" type="text" autoComplete="name" required />
            </label>
            <label>
              Email address
              <input
                name="bookingEmail"
                type="email"
                autoComplete="email"
                required
              />
            </label>
            <label>
              Preferred date and time
              <input
                name="preferredDateTime"
                type="datetime-local"
                min={getLocalDateTime()}
                required
              />
            </label>
            <label>
              Reason for meeting / agenda
              <textarea name="agenda" rows={4} required />
            </label>
            <button className={styles.button} type="submit">
              Request meeting <span aria-hidden="true">↗</span>
            </button>
            {bookingMessage && (
              <p className={styles.formStatus} role="status">
                {bookingMessage}
              </p>
            )}
          </form>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>Najeema · Portfolio</span>
        <a href="#home">Back to top ↑</a>
      </footer>

      {selectedProject && (
        <div
          className={styles.modalBackdrop}
          onClick={closeProject}
          role="presentation"
        >
          <section
            className={styles.projectModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className={styles.modalClose}
              type="button"
              onClick={closeProject}
              aria-label="Close project details"
            >
              Close ✕
            </button>
            <h2 id="project-dialog-title">{selectedProject.title}</h2>
            <p>{selectedProject.description}</p>
            <div className={styles.modalImage}>
              <span className={styles.projectFallback} aria-hidden="true">
                PROJECT PHOTO
              </span>
              <Image
                src={selectedProject.imageUrl}
                alt={`Large photo of ${selectedProject.title}`}
                fill
                sizes="(max-width: 800px) 90vw, 800px"
                className={styles.projectImage}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </div>
          </section>
        </div>
      )}
    </main>
  );
}



