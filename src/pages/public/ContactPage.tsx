import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { supabase } from '../../config/supabase.config';
import {
  Search,
  Map,
  Users,
  AlertTriangle,
  Heart,
  Mail,
  Menu,
  X,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Clock,
  Facebook,
  Twitter,
  Instagram,
} from 'lucide-react';
import styles from './ContactPage.module.css';

interface FormData {
  nom: string;
  email: string;
  telephone?: string;
  sujet: string;
  message: string;
}

export const ContactPage: React.FC = () => {
  const { t, language, changeLanguage } = useI18n();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    nom: '',
    email: '',
    telephone: '',
    sujet: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const toggleLanguage = () => {
    changeLanguage(language === 'fr' ? 'en' : 'fr');
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const contactData = {
        nom: formData.nom,
        email: formData.email,
        telephone: formData.telephone || null,
        sujet: formData.sujet,
        message: formData.message,
        date_creation: new Date().toISOString(),
        statut: 'nouveau',
      };

      const { error: err } = await (supabase as any).from('contacts').insert([contactData]);

      if (err) throw err;

      setSuccess(true);
      setFormData({
        nom: '',
        email: '',
        telephone: '',
        sujet: '',
        message: '',
      });

      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(language === 'fr' ? 'Erreur lors de l\'envoi du message' : 'Error sending message');
    } finally {
      setLoading(false);
    }
  };

  const subjects = language === 'fr'
    ? [
        { value: 'signalement', label: 'Signaler une disparition' },
        { value: 'avis', label: 'Donner un avis' },
        { value: 'partenariat', label: 'Partenariat' },
        { value: 'don', label: 'Faire un don' },
        { value: 'bug', label: 'Signaler un problème' },
        { value: 'autre', label: 'Autre' },
      ]
    : [
        { value: 'signalement', label: 'Report a disappearance' },
        { value: 'avis', label: 'Give feedback' },
        { value: 'partenariat', label: 'Partnership' },
        { value: 'don', label: 'Make a donation' },
        { value: 'bug', label: 'Report a bug' },
        { value: 'autre', label: 'Other' },
      ];

  return (
    <div className={styles.contactPage}>
      {/* Navigation */}
      <nav className={styles.navbar}>
        <div className={styles.navContainer}>
          <Link to="/" className={styles.logo}>
            <Search size={24} />
            <span>RETROUVONSLES</span>
          </Link>

          <div className={`${styles.navLinks} ${mobileMenuOpen ? styles.navLinksOpen : ''}`} aria-hidden={!mobileMenuOpen}>
            <Link to="/" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>
              <Search size={16} />
              {t('public.navbar.home')}
            </Link>
            <Link to="/map" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>
              <Map size={16} />
              {t('public.navbar.map')}
            </Link>
            <Link to="/disparitions" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>
              <Users size={16} />
              {t('public.navbar.search')}
            </Link>
            <Link to="/signaler" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>
              <AlertTriangle size={16} />
              {t('public.navbar.report')}
            </Link>
            <Link to="/about" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>
              <Heart size={16} />
              {t('public.navbar.about')}
            </Link>
            <Link to="/contact" className={`${styles.navLink} ${styles.active}`} onClick={() => setMobileMenuOpen(false)}>
              <Mail size={16} />
              {t('public.navbar.contact')}
            </Link>
          </div>

          <div className={styles.navActions}>
            <button className={styles.langBtn} onClick={toggleLanguage}>
              {language === 'fr' ? 'EN' : 'FR'}
            </button>
            <button className={styles.loginBtn} onClick={() => navigate('/auth/login')}>
              {t('public.navbar.login')}
            </button>
            <button
              type="button"
              className={styles.mobileMenuBtn}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>{t('public.contact.title')}</h1>
          <p>{t('public.contact.subtitle')}</p>
        </div>
      </section>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.container}>
          <div className={styles.contentWrapper}>
            {/* Form Section */}
            <div className={styles.formSection}>
              <div className={styles.formHeader}>
                <MessageSquare size={24} />
                <h2>{language === 'fr' ? 'Envoyez-nous un message' : 'Send us a message'}</h2>
              </div>

              {success && (
                <div className={styles.successMessage}>
                  {language === 'fr'
                    ? 'Votre message a été envoyé avec succès !'
                    : 'Your message has been sent successfully!'}
                </div>
              )}

              {error && <div className={styles.errorMessage}>{error}</div>}

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="nom">
                      {language === 'fr' ? 'Nom complet' : 'Full name'} *
                    </label>
                    <input
                      id="nom"
                      type="text"
                      name="nom"
                      value={formData.nom}
                      onChange={handleChange}
                      required
                      placeholder={language === 'fr' ? 'Votre nom' : 'Your name'}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="email">Email *</label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder={language === 'fr' ? 'votre@email.com' : 'your@email.com'}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="telephone">
                      {language === 'fr' ? 'Téléphone' : 'Phone'}
                    </label>
                    <input
                      id="telephone"
                      type="tel"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleChange}
                      placeholder="+237 6XX XXX XXX"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="sujet">{language === 'fr' ? 'Sujet' : 'Subject'} *</label>
                    <select
                      id="sujet"
                      name="sujet"
                      value={formData.sujet}
                      onChange={handleChange}
                      required
                    >
                      <option value="">
                        {language === 'fr' ? 'Sélectionnez un sujet' : 'Select a subject'}
                      </option>
                      {subjects.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    placeholder={
                      language === 'fr' ? 'Votre message...' : 'Your message...'
                    }
                    rows={6}
                  />
                </div>

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  <Send size={18} />
                  {loading
                    ? language === 'fr'
                      ? 'Envoi...'
                      : 'Sending...'
                    : language === 'fr'
                    ? 'Envoyer le message'
                    : 'Send Message'}
                </button>
              </form>
            </div>

            {/* Info Section */}
            <div className={styles.infoSection}>
              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <Mail size={24} />
                </div>
                <h3>Email</h3>
                <a href="mailto:contact@retrouvonsles.org">contact@retrouvonsles.org</a>
              </div>

              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <Phone size={24} />
                </div>
                <h3>{language === 'fr' ? 'Téléphone' : 'Phone'}</h3>
                <a href="tel:+237600000000">+237 600 000 000</a>
              </div>

              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <MapPin size={24} />
                </div>
                <h3>{language === 'fr' ? 'Adresse' : 'Address'}</h3>
                <p>Yaoundé, Cameroun</p>
              </div>

              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <Clock size={24} />
                </div>
                <h3>{language === 'fr' ? 'Horaires' : 'Hours'}</h3>
                <p>
                  {language === 'fr' ? 'Lun - Ven: 8h - 18h' : 'Mon - Fri: 8am - 6pm'}
                </p>
              </div>

              <div className={styles.socialCard}>
                <h3>{language === 'fr' ? 'Suivez-nous' : 'Follow Us'}</h3>
                <div className={styles.socialLinks}>
                  <button type="button" className={styles.socialLink} aria-label="Facebook">
                    <Facebook size={20} />
                  </button>
                  <button type="button" className={styles.socialLink} aria-label="Twitter">
                    <Twitter size={20} />
                  </button>
                  <button type="button" className={styles.socialLink} aria-label="Instagram">
                    <Instagram size={20} />
                  </button>
                </div>
              </div>

              <div className={styles.emergencyCard}>
                <AlertTriangle size={24} />
                <h4>{language === 'fr' ? 'Urgence' : 'Emergency'}</h4>
                <p>
                  {language === 'fr'
                    ? 'En cas d\'urgence, appelez immédiatement :'
                    : 'In case of emergency, call immediately:'}
                </p>
                <div className={styles.emergencyNumbers}>
                  <span>117</span>
                  <span>1511</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p>
            © {new Date().getFullYear()} RETROUVONSLES.{' '}
            {language === 'fr' ? 'Tous droits réservés.' : 'All rights reserved.'}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ContactPage;
