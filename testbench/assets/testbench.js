function logTag(tag) {
  const event = new CustomEvent(`cy:gtm.tag.fired`, {detail: tag});
  document.dispatchEvent(event);
}

(function() {

  const _Namespace = 'simple-consent:';

  const bootManager = () => {
    
    const defaultContainerId = 'PTLD5H79';

    let config;
    const activeConfig = Alpine.store('app').getActiveConfig();
    const isMultiConfig = activeConfig.hasOwnProperty('_default');

    let overrides = {
      gtm: {
        loadContainer: true,
        containerId: `GTM-${Alpine.store('app').getContainerId() || defaultContainerId}`,
      }
    };

    const defaultUi = {
      placement: {
        banner: ['bottom', 'left'],
        settingsButton: ['bottom', 'left'],
      },
      showServiceLogos: true,
    };

    if (activeConfig.gtm)
      delete activeConfig.gtm;

    if (activeConfig.ui) {
      activeConfig.ui.placement = defaultUi.placement;
    } else {
      overrides.ui = defaultUi;
    }

    if (isMultiConfig) {
      activeConfig._default = Object.assign({}, activeConfig._default, overrides);
      config = activeConfig;
    } else {
      config = Object.assign({}, activeConfig, overrides);
    }

    new SimpleConsent(config);

    Alpine.store('app').configs.resolved = SimpleConsent.manager().config;

  };

  const clearLog = () => Alpine.store('log').tags = [];

  document.addEventListener('simple-consent:destroy', clearLog);
  document.addEventListener('simple-consent:reset', clearLog);
  document.addEventListener('simple-consent:datalayer.push', (e) => Alpine.store('app').updateDataLayer(e.detail) );

  const debounce = (func, delay) => {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  };

  const loadCustomConfigs = () => {
    
    const items = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(`${_Namespace}custom.`)) {
        const config = JSON.parse(localStorage.getItem(key));
        items[key.replace(_Namespace, '')] = config;
      }
    }

    return items;

  };

  const setMainMinHeight = () => {

    const header = document.querySelector('header[data-testbench-header]');
    const main = document.querySelector('main[data-testbench-body]');
    const footer = document.querySelector('footer[data-testbench-footer]');

    main.style.minHeight = `calc(100vh - (${header.offsetHeight + (footer.offsetHeight)}px)`;

  };

  const storeConfig = (key, value) => {
    localStorage.setItem(`${_Namespace}${key}`, JSON.stringify(value));
  };

  window.addEventListener('resize', debounce(setMainMinHeight, 250));

  document.addEventListener('submit', (e) => {
    
    if (! e.target.hasAttribute('data-testbench-controls')) 
      return;
    
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    let queryParams = new URLSearchParams({
      lang: formData.get('lang'),
      config: formData.get('config'),
    });

    if (formData.get('lang'))
      document.documentElement.lang = formData.get('lang');

    if (formData.get('container_id'))
      queryParams.set('container_id', formData.get('container_id').toUpperCase());

    history.pushState({}, '', `${location.pathname}?${queryParams.toString()}`);

    Alpine.store('app').setActiveConfig(formData.get('config'));
    Alpine.store('app').dataLayer = {};

    SimpleConsent.manager().destroy();
    bootManager();

  });

  document.addEventListener('submit', (e) => {

    if (! e.target.hasAttribute('data-testbench-config-editor')) 
      return;

    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    const validateJson = (json) => {
      try {
        JSON.parse(json);
        return true;
      } catch (e) {
        return false;
      }
    };

    const configKey = formData.get('config_name').startsWith(`custom.`) ? formData.get('config_name') : Alpine.store('editor').makeConfigKey(formData.get('config_name'));
    const configJson = JSON.parse(formData.get('config_json'));
    
    Alpine.store('editor').save(configKey, configJson);

  });

  document.addEventListener('click', (e) => {

    if (! e.target.matches('a[href*="webmechanix.com"], a[href*="level.agency"], a[href*="derekcavaliero.com"]'))
      return;

    e.target.target = '_blank';
    e.target.href += '?utm_source=Open%20Source&utm_medium=SimpleConsent&utm_campaign=Derek%20Cavaliero';

  });

  document.addEventListener('alpine:init', () => {

    const Url = new URL(window.location.href);

    const l10n = {
      "de": {
        content: {
          banner: {
            heading: 'Datenschutzhinweis',
            description: 'Diese Website verwendet Cookies (oder andere Browser-Speichermöglichkeiten), um unsere Dienste bereitzustellen und/oder die Nutzung unserer Website zu analysieren. Diese Informationen werden auch durch die Verwendung von Tracking-Skripten/Pixeln mit Werbepartnern geteilt.',
            actions: {
              acceptAll: 'Alle akzeptieren',
              denyAll: 'Alle ablehnen',
              showSettings: 'Einstellungen bearbeiten'
            }
          },
          notices: {
            required: {
              badge: 'Immer aktiviert'
            },
            gpc: {
              badge: 'Durch GPC deaktiviert',
              heading: 'Globale Datenschutzkontrolle (GPC)',
              description: 'Einige Dienste wurden deaktiviert, um Ihr Opt-out-Signal zu respektieren.'
            }
          },
          modal: {
            heading: 'Ihre Datenschutzoptionen',
            description: 'Diese Website verwendet Dienste, die Speicherfunktionen in Ihrem Browser (über Cookies oder andere Browser-Speicherfunktionen) nutzen, um Informationen zu sammeln. Sie können bestimmte Arten der Datenerfassung mit den folgenden Steuerungsmöglichkeiten genehmigen oder ablehnen.',
            toggleAll: 'Alle aktivieren/deaktivieren',
            actions: {
              acceptAll: 'Alle akzeptieren',
              acceptSelected: 'Ausgewählte akzeptieren',
              denyAll: 'Alle ablehnen',
              saveSettings: 'Einstellungen speichern'
            }
          },
          links: {
            privacyPolicy: {
              text: 'Datenschutzrichtlinie',
              url: '#/privacy-policy'
            },
            termsOfService: null,
            cookiePolicy: {
              text: 'Cookie-Richtlinie',
              url: '#/cookie-policy'
            }
          }
        }
      },
      "es": {
        content: {
          banner: {
            heading: 'Aviso de privacidad',
            description: 'Este sitio web utiliza cookies (u otro almacenamiento del navegador) para ofrecer nuestros servicios y/o analizar el uso de nuestro sitio web. Esta información también se comparte con socios publicitarios mediante el uso de scripts/píxeles de seguimiento.',
            actions: {
              acceptAll: 'Aceptar todo',
              denyAll: 'Rechazar todo',
              showSettings: 'Editar preferencias'
            }
          },
          notices: {
            required: {
              badge: 'Siempre activado'
            },
            gpc: {
              badge: 'Desactivado por GPC',
              heading: 'Control de Privacidad Global (GPC)',
              description: 'Algunos servicios han sido desactivados para respetar su señal de exclusión.'
            }
          },
          modal: {
            heading: 'Sus opciones de privacidad',
            description: 'Este sitio web utiliza servicios que emplean funciones de almacenamiento en su navegador (a través de cookies u otras funcionalidades de almacenamiento del navegador) para recopilar información. Puede elegir conceder o denegar ciertos tipos de recopilación de datos utilizando los controles a continuación.',
            toggleAll: 'Activar/Desactivar todo',
            actions: {
              acceptAll: 'Aceptar todo',
              acceptSelected: 'Aceptar seleccionados',
              denyAll: 'Rechazar todo',
              saveSettings: 'Guardar preferencias'
            }
          },
          links: {
            privacyPolicy: {
              text: 'Política de privacidad',
              url: '#/privacy-policy'
            },
            termsOfService: null,
            cookiePolicy: {
              text: 'Política de cookies',
              url: '#/cookie-policy'
            }
          }
        }
      },
      "fr": {
        content: {
          banner: {
            heading: '🍪 & Confidentialité',
            description: 'Nous utilisons des cookies pour offrir la meilleure expérience. En cliquant sur "Accepter", vous acceptez l\'utilisation des cookies.',
            actions: {
              showSettings: 'Préférences',
              acceptAll: 'Accepter',
              denyAll: 'Refuser',
            },
          },
          modal: {
            heading: 'Préférences de confidentialité',
            description: 'Ceci est un aperçu des cookies que nous utilisons. Vous pouvez choisir les cookies que vous souhaitez accepter.',
            actions: {
              acceptAll: 'Tout accepter',
              acceptSelected: 'Accepter la sélection',
              saveSettings: 'Sauvegarder',
              denyAll: 'Tout refuser',
            },
          },
          links: {
            privacyPolicy: {
              text: 'Politique de confidentialité',
            },
            cookiePolicy: {
              text: 'Politique de cookies',
            },
          }
        },
        services: {},
        types: {
          necessary: {
            name: 'Nécessaire',
            description: 'Les cookies nécessaires permettent des fonctionnalités de base telles que la navigation de page et l\'accès aux zones sécurisées du site Web. Le site Web ne peut pas fonctionner correctement sans ces cookies.',
          },
          analytics_storage: {
            name: 'Analyse & Performance',
            description: 'Active le stockage et les services qui sont utilisés pour mesurer les visites, les sessions et certains types d\'activité en page (comme les clics sur les boutons).',
          },
          advertising: {
            name: 'Publicité Ciblage & Mesure',
            description: 'Active les services et services à toutes fins publicitaires. Cela inclut, la personnalisation des annonces, les cookies publicitaires, les données utilisateur partagées avec nos partenaires publicitaires.',
          },
          personalization_storage: {
            name: 'Stockage de personnalisation',
            description: 'Active le stockage et les services liés à la personnalisation, par exemple les recommandations vidéo et les préférences de compte.',
          },
          functionality_storage: {
            name: 'Stockage fonctionnel',
            description: 'Active le stockage et les services qui prennent en charge la fonctionnalité du site Web ou de l\'application (par exemple, les paramètres de langue).',
          },
          security_storage: {
            name: 'Stockage de sécurité',
            description: 'Active le stockage et les services liés à la sécurité tels que la fonctionnalité d\'authentification, la prévention de la fraude et d\'autres protections des utilisateurs.'
          }
        },
      },
      "pt-br": {
        content: {
          banner: {
            heading: 'Aviso de Privacidade',
            description: 'Este site usa cookies (ou outro armazenamento do navegador) para fornecer nossos serviços e/ou analisar o uso do nosso site. Essas informações também são compartilhadas com parceiros de publicidade através do uso de scripts/pixels de rastreamento.',
            actions: {
              acceptAll: 'Aceitar Tudo',
              denyAll: 'Recusar Tudo',
              showSettings: 'Editar Preferências',
            },
          },
          links: {
            privacyPolicy: {
              text: 'Política de Privacidade',
              url: '#/privacy-policy',
            },
            termsOfService: null,
            cookiePolicy: {
              text: 'Política de Cookies',
              url: '#/cookie-policy',
            },
          },
          modal: {
            heading: 'Suas Escolhas de Privacidade',
            description: 'Este site usa serviços que utilizam recursos de armazenamento no seu navegador (via cookies ou outras funcionalidades de armazenamento do navegador) para coletar informações. Você pode escolher permitir ou negar certos tipos de coleta de dados usando os controles abaixo.',
            toggleAll: 'Ativar/Desativar Tudo',
            actions: {
              acceptAll: 'Aceitar Tudo',
              acceptSelected: 'Aceitar Selecionados',
              denyAll: 'Recusar Tudo',
              saveSettings: 'Salvar Preferências',
            },
          },
          notices: {
            required: {
              badge: 'Sempre Ativo',
            },
            gpc: {
              badge: 'Desativado pelo GPC',
              description: 'Alguns serviços foram automaticamente desativados para respeitar seu sinal de opção de exclusão do Global Privacy Control.',
            },
          },
        }
      },
      "pt-pt": {
        content: {
          banner: {
            heading: 'Aviso de Privacidade',
            description: 'Este site utiliza cookies (ou outro armazenamento do navegador) para fornecer os nossos serviços e/ou analisar a utilização do nosso site. Esta informação também é partilhada com parceiros publicitários através do uso de scripts/pixels de rastreamento.',
            actions: {
              acceptAll: 'Aceitar Tudo',
              denyAll: 'Recusar Tudo',
              showSettings: 'Editar Preferências',
            },
          },
          links: {
            privacyPolicy: {
              text: 'Política de Privacidade',
              url: '#/privacy-policy',
            },
            termsOfService: null,
            cookiePolicy: {
              text: 'Política de Cookies',
              url: '#/cookie-policy',
            },
          },
          modal: {
            heading: 'As Suas Escolhas de Privacidade',
            description: 'Este site utiliza serviços que usam recursos de armazenamento no seu navegador (via cookies ou outras funcionalidades de armazenamento do navegador) para recolher informações. Pode escolher conceder ou negar certos tipos de recolha de dados utilizando os controlos abaixo.',
            toggleAll: 'Ativar/Desativar Tudo',
            actions: {
              acceptAll: 'Aceitar Tudo',
              acceptSelected: 'Aceitar Selecionados',
              denyAll: 'Recusar Tudo',
              saveSettings: 'Guardar Preferências',
            },
          },
          notices: {
            required: {
              badge: 'Sempre Ativo',
            },
            gpc: {
              badge: 'Desativado pelo GPC',
              description: 'Alguns serviços foram automaticamente desativados para respeitar o seu sinal de opção de exclusão do Global Privacy Control.',
            },
          },
        }
      },
      "tr": {
        content: {
          banner: {
            heading: 'Gizlilik Bildirimi',
            description: 'Bu web sitesi, hizmetlerimizi sunmak ve/veya web sitesi kullanımımızı analiz etmek için çerezleri (veya diğer tarayıcı depolama özelliklerini) kullanır. Bu bilgiler ayrıca izleme komut dosyaları/pikselleri kullanılarak reklam ortaklarıyla paylaşılır.',
            actions: {
              acceptAll: 'Tümünü Kabul Et',
              denyAll: 'Tümünü Reddet',
              showSettings: 'Tercihleri Düzenle',
            },
          },
          links: {
            privacyPolicy: {
              text: 'Gizlilik Politikası',
              url: '#/privacy-policy',
            },
            termsOfService: null,
            cookiePolicy: {
              text: 'Çerez Politikası',
              url: '#/cookie-policy',
            },
          },
          modal: {
            heading: 'Gizlilik Tercihleriniz',
            description: 'Bu web sitesi, bilgi toplamak için tarayıcınızdaki depolama özelliklerini (çerezler veya diğer tarayıcı depolama işlevselliği aracılığıyla) kullanan hizmetlerden yararlanır. Aşağıdaki kontrolleri kullanarak belirli veri toplama türlerine izin verebilir veya reddedebilirsiniz.',
            toggleAll: 'Tümünü Etkinleştir/Devre Dışı Bırak',
            actions: {
              acceptAll: 'Tümünü Kabul Et',
              acceptSelected: 'Seçilenleri Kabul Et',
              denyAll: 'Tümünü Reddet',
              saveSettings: 'Tercihleri Kaydet',
            },
          },
          notices: {
            required: {
              badge: 'Her Zaman Etkin',
            },
            gpc: {
              badge: 'GPC Tarafından Devre Dışı Bırakıldı',
              description: 'Bazı hizmetler, Global Privacy Control devre dışı bırakma sinyalinize saygı göstermek için otomatik olarak devre dışı bırakılmıştır.',
            },
          },
        }
      },
      "ru": {
        content: {
          banner: {
            heading: 'Уведомление о конфиденциальности',
            description: 'Этот веб-сайт использует файлы cookie (или другие средства хранения браузера) для предоставления наших услуг и/или анализа использования нашего веб-сайта. Эта информация также передается рекламным партнерам через использование скриптов/пикселей отслеживания.',
            actions: {
              acceptAll: 'Принять все',
              denyAll: 'Отклонить все',
              showSettings: 'Изменить настройки',
            },
          },
          links: {
            privacyPolicy: {
              text: 'Политика конфиденциальности',
              url: '#/privacy-policy',
            },
            termsOfService: null,
            cookiePolicy: {
              text: 'Политика использования файлов cookie',
              url: '#/cookie-policy',
            },
          },
          modal: {
            heading: 'Ваши настройки конфиденциальности',
            description: 'Этот веб-сайт использует сервисы, которые используют функции хранения в вашем браузере (через файлы cookie или другие функции хранения браузера) для сбора информации. Вы можете выбрать, разрешить или запретить определенные типы сбора данных, используя элементы управления ниже.',
            toggleAll: 'Включить/Отключить все',
            actions: {
              acceptAll: 'Принять все',
              acceptSelected: 'Принять выбранное',
              denyAll: 'Отклонить все',
              saveSettings: 'Сохранить настройки',
            },
          },
          notices: {
            required: {
              badge: 'Всегда включено',
            },
            gpc: {
              badge: 'Отключено GPC',
              description: 'Некоторые сервисы были автоматически отключены в соответствии с вашим сигналом Global Privacy Control об отказе.',
            },
          },
        }
      }
    };

    const services = {
      "cloudflare": {
        "name": "Cloudflare",
        "description": "Provides security and performance optimization for websites, protecting them from malicious traffic while improving load times by caching content and optimizing delivery.",
        "domain": "cloudflare.com",
        "storage": {
          "security": {
            "__cf_bm": {
              "purpose": "Contains information related to the calculation of Cloudflare's proprietary bot score and, when Anomaly Detection is enabled on Bot Management, a session identifier.",
              "expires": "30 minutes"
            }
          }
        },
        "types": ["necessary", "security_storage"]
      },
      "google_analytics": {
        "name": "Google Analytics",
        "description": "Tracks and reports website traffic and user behavior, helping to analyze visitor data for improving site performance and user experience.",
        "domain": "analytics.google.com",
        "storage": {
          "analytics_storage": {
            "_ga": {
              "purpose": "Browser (client) indentifer. Used to distinguish a unique browser (anonymous user).",
              "expires": "2 years"
            },
            "_ga_XXXXXXXXXX": {
              "pattern": "/_ga_[A-Z\\d]{6,}/",
              "purpose": "Session indentifer. Used to distinguish current session, session count, and other related session information.",
              "expires": "2 years"
            }
          }
        },
        "types": ["analytics_storage", "advertising"]
      },
      "google_ads": {
        "name": "Google Ads",
        "domain": "ads.google.com",
        "description": "Online advertising platform that allows businesses to create ads that appear on Google's search engine and other properties, targeting users based on their search queries and interests.",
        "storage": {
          "advertising": {
            "_gcl_au": {
              "purpose": "",
              "expires": "90 days"
            },
            "_gcl_aw": {
              "purpose": "Stores click identifier and timestamp of the most recent Google Ads click.",
              "expires": "90 days"
            }
          }
        },
        "types": ["advertising"]
      },
      "hubspot": {
        "name": "HubSpot",
        "description": "Marketing Automation & CRM platform that includes tools for marketing, sales, and customer service, offering features like email marketing, analytics, and lead tracking.",
        "domain": "hubspot.com",
        "storage": {
          "analytics_storage": {
            "__hssc": {
              "purpose": "This cookie keeps track of sessions. This is used to determine if HubSpot should increment the session number and timestamps in the __hstc cookie. It contains the domain, viewCount (increments each pageView in a session), and session start timestamp.",
              "expires": "30 minutes"
            },
            "__hssrc": {
              "purpose": "Whenever HubSpot changes the session cookie, this cookie is also set to determine if the visitor has restarted their browser. If this cookie does not exist when HubSpot manages cookies, it is considered a new session. It contains the value \"1\" when present.",
              "expires": "1 year"
            },
            "__hstc": {
              "purpose": "The main cookie for tracking visitors. Contains the domain, hubspotutk, initial timestamp (first visit), last timestamp (last visit), current timestamp (this visit), and session number (increments for each subsequent session).",
              "expires": "180 days"
            },
            "hubspotutk": {
              "purpose": "Keeps track of a visitor's identity. It is passed to HubSpot on form submission and used when deduplicating contacts. It contains an opaque GUID to represent the current visitor.",
              "expires": "180 days"
            },
            "messagesUtk": {
              "purpose": "Used by to recognize visitors who use HubSpot chatbots and live chat features. ",
              "expires": "180 days"
            }
          }
        },
        "types": ["analytics_storage", "personalization_storage"]
      },
      "linkedin_ads": {
        "name": "LinkedIn Ads",
        "description": "Offers targeted advertising solutions on LinkedIn, allowing businesses to reach professionals based on their job title, industry, and other professional attributes.",
        "domain": "linkedin.com",
        "storage": {
          "advertising": {
            "li_fat_id": {
              "purpose": "Unique browser/user indentifer.",
              "expires": "30 days"
            }
          }
        },
        "types": ["advertising"]
      },
      "marketo": {
        "name": "Adobe Marketo Engage",
        "description": "Marketing automation platform that helps with lead management, email marketing, and campaign reporting, enabling businesses to engage customers across multiple channels.",
        "domain": "adobe.com",
        "storage": {
          "analytics_storage": {
            "_mkto_trk": {
              "purpose": "Keeps track of a visitor's identity. It is passed to Marketo on form submission and used when deduplicating contacts. It contains an opaque GUID to represent the current visitor.",
              "expires": "2 years"
            }
          }
        },
        "types": ["analytics_storage"]
      },
      "meta_ads": {
        "name": "Facebook Ads",
        "description": "(AKA Meta Ads) enables businesses to create targeted advertisements on Facebook, Instagram, and other Meta platforms, reaching users based on their demographics, interests, and behaviors.",
        "domain": "facebook.com",
        "storage": {
          "advertising": {
            "_fbp": {
              "purpose": "Browser (client) indentifer. Used to distinguish a unique browser (anonymous user).",
              "expires": "90 days"
            },
            "_fbc": {
              "purpose": "Stores click identifier and timestamp of the most recent Meta Ads click.",
              "expires": "90 days"
            }
          }
        },
        "types": ["advertising"]
      },
      "microsoft_ads": {
        "name": "Microsoft Ads",
        "description": "(Formerly Bing Ads) allows businesses to display ads on the Bing search engine and its partner sites, targeting users based on their search behavior and demographics.",
        "domain": "microsoft.com",
        "storage": {
          "advertising": {
            "_uetmsclkid": {
              "purpose": "Stores click identifier and timestamp of the most recent Microsoft Ads click.",
              "expires": "90 days"
            },
            "_uetsid": {
              "purpose": "Used to distinguish current session.",
              "expires": "1 day"
            },
            "_uetvid": {
              "purpose": "Browser (client) indentifer. Used to distinguish a unique browser (anonymous user).",
              "expires": "2 years"
            }
          }
        },
        "types": ["advertising"]
      }
    };

    const types = {
      "analytics_storage": {
        "name": "Analytics & Performance",
        "description": "Enables storage and services that are used to measure visits, sessions, and certain types of on-page activity (such as clicks on buttons).",
        "gpc": true
      },
      "advertising": {
        "name": "Ad Targeting & Measurement",
        "description": "Enables services and services for all advertising purposes. This includes, ad personalization, advertising cookies, user data shared with our advertising partners.",
        "mapTo": ["ad_storage", "ad_personalization", "ad_user_data"],
        "gpc": true
      },
      "personalization_storage": {
        "name": "Personalization Storage",
        "description": "Enables storage and services related to personalization e.g. video recommendations, and account preferences."
      },
      "functionality_storage": {
        "name": "Functional Storage",
        "description": "Enables storage and services that supports the functionality of the website or app (e.g. language settings)."
      },
      "security_storage": {
        "name": "Security Storage",
        "description": "Enables storage and services related to security such as authentication functionality, fraud prevention, and other user protection.",
        "required": true
      }
    };

    Alpine.store('app', {
      configs: {
        active: {},
        custom: loadCustomConfigs(),
        default: {
          'Default' : {
            services,
            types,
          },
          'CCPA' : {
            "actions": {
              "banner": {
                "denyAll": false
              }
            },
            "consentModel": "opt-out",
            "content": {
              "banner": {
                "actions": {
                  "showSettings": "Do Not Sell My Personal Info",
                  "acceptAll": "Accept"
                }
              },
              "modal": {
                "actions": {
                  "denyAll": "Do Not Sell My Personal Info"
                }
              }
            },
            services,
            types,
          },
          "Multi-Config": {
            "_default": {
              "geoLocate": function() {

                const endpoint = 'https://ipv4-check-perf.radar.cloudflare.com/api/info';
          
                return fetch(endpoint).then((response) => {
          
                  if (! response.ok) 
                    throw new Error('Network response was not ok');
                  
                  return response.json();
                
                }).then(data => {

                  if (data.country === 'US') {

                    let stateAbbreviations = {
                      "Alabama": "AL",
                      "Alaska": "AK",
                      "Arizona": "AZ",
                      "Arkansas": "AR",
                      "California": "CA",
                      "Colorado": "CO",
                      "Connecticut": "CT",
                      "Delaware": "DE",
                      "Florida": "FL",
                      "Georgia": "GA",
                      "Hawaii": "HI",
                      "Idaho": "ID",
                      "Illinois": "IL",
                      "Indiana": "IN",
                      "Iowa": "IA",
                      "Kansas": "KS",
                      "Kentucky": "KY",
                      "Louisiana": "LA",
                      "Maine": "ME",
                      "Maryland": "MD",
                      "Massachusetts": "MA",
                      "Michigan": "MI",
                      "Minnesota": "MN",
                      "Mississippi": "MS",
                      "Missouri": "MO",
                      "Montana": "MT",
                      "Nebraska": "NE",
                      "Nevada": "NV",
                      "New Hampshire": "NH",
                      "New Jersey": "NJ",
                      "New Mexico": "NM",
                      "New York": "NY",
                      "North Carolina": "NC",
                      "North Dakota": "ND",
                      "Ohio": "OH",
                      "Oklahoma": "OK",
                      "Oregon": "OR",
                      "Pennsylvania": "PA",
                      "Rhode Island": "RI",
                      "South Carolina": "SC",
                      "South Dakota": "SD",
                      "Tennessee": "TN",
                      "Texas": "TX",
                      "Utah": "UT",
                      "Vermont": "VT",
                      "Virginia": "VA",
                      "Washington": "WA",
                      "West Virginia": "WV",
                      "Wisconsin": "WI",
                      "Wyoming": "WY"
                    };

                    return [data.country, stateAbbreviations[data.region]].join('-');
                  }

                  return data.country;

                }).catch((error) => {
                  console.error('SimpleConsent: Error fetching geo location data.', error);
                });
          
              },
              services,
              types,
            },
            "_router": [
              {
                "config": "US/DEFAULT",
                "geoMatch": "US",
              },
              {
                "config": "US/CCPA-Like",
                "geoMatch": "US-(CA|CO|CT|MT|OR|TX|UT|VA)",
              }
            ],
            'US/DEFAULT': {
              "consentModel": "opt-out",
            },
            'US/CCPA-Like': {
              "actions": {
                "banner": {
                  "denyAll": false
                }
              },
              "consentModel": "opt-out",
              "content": {
                "banner": {
                  "actions": {
                    "showSettings": "Do Not Sell My Personal Info",
                    "acceptAll": "Accept"
                  }
                },
                "modal": {
                  "actions": {
                    "denyAll": "Do Not Sell My Personal Info"
                  }
                }
              },
            },
          }
        },
        resolved: {}
      },
      dataLayer: {},
      console: {
        config: null,
        dataLayer: null,
      },
      controls: {
        lang: Url.searchParams.get('lang') || 'en',
        config: Url.searchParams.get('config') || 'Default',
        containerId: Url.searchParams.get('container_id') || '',
      },
      boot() {

        if (Url.searchParams.get('lang'))
          document.documentElement.lang = Url.searchParams.get('lang');

        this.setActiveConfig(Url.searchParams.get('config') || 'Default');

        [
          'config',
          'dataLayer',
        ].forEach(key => {

          this.console[key] = ace.edit(document.querySelector(`[data-ace-editor="${key}"]`), {
            mode: 'ace/mode/json',
            readOnly: true,
            showPrintMargin: false,
            tabSize: 2,
            theme: 'ace/theme/one_dark',
            wrap: true
          });
          
          this.console[key].container.style.lineHeight = "1.4";
          this.console[key].renderer.setScrollMargin(16, 16);
          this.console[key].renderer.on('afterRender', function() {
            document.querySelector(`[data-ace-editor="${key}"]`).classList.add('is-loaded');
          });

          if (key === 'config')
            this.console[key].setValue(JSON.stringify(this.getActiveConfig(), null, 2), -1);

          if (key === 'dataLayer')
            this.console[key].setValue(JSON.stringify(this.dataLayer, null, 2), -1);

        });

      },
      changeConfig(value) {
        this.setActiveConfig(value);
        this.updateUrl('config', value);
        SimpleConsent.manager().destroy();
        bootManager();
      },
      changeLang(value) {
        document.documentElement.lang = value;
        this.updateUrl('lang', value);
        SimpleConsent.manager().destroy();
        bootManager();
      },
      getActiveConfig() {
        return this.configs.active;
      },
      getResolvedConfig() {
        return this.configs.resolved;
      },
      setActiveConfig(configKey) {
        this.configs.active = (configKey.startsWith('custom.')) ? this.configs.custom[configKey] : this.configs.default[configKey];
      },
      getConfig(configKey) {
      
        if (configKey.startsWith('custom.'))
          return this.configs.custom[configKey];

        return this.configs.default[configKey];

      },
      getConfigOptionLabel(key) {
        return key.replace(`custom.`, '');
      },
      getContainerId() {
        return this.controls.containerId.replace('GTM-', '').toUpperCase();
      },
      removeConfig(key) {
        
        delete this.configs.custom[key];
        localStorage.removeItem(`${_Namespace}${key}`);
        
        updateUrl('config', 'Default');
        this.setActiveConfig('Default');

        Alpine.store('editor').reset();
        Alpine.store('editor').modal.hide();

        bootManager();

      },
      setConsoleValue(key, value) {
        this.console[key].setValue(JSON.stringify(value, null, 2), -1);
      },
      setControl(key, value) {
        this.controls[key] = value;
        this.updateUrl(key, value);
      },
      updateDataLayer(data) {
        this.dataLayer = data;
      },
      upsertConfig(key, value) {

        this.configs.custom[key] = value;
        storeConfig(key, value);        

        this.setActiveConfig(key);
        this.setControl('config', key);

        bootManager();

      },
      updateUrl(key, value) {
        const Url = new URL(window.location.href);
        Url.searchParams.set(key, value);
        history.pushState({}, '', Url.toString());
      }
    });

    Alpine.store('editor', {
      editor: null,
      errors: {
        json: null,
        name: null,
      },
      json: {},
      modal: new bootstrap.Modal(document.querySelector('[data-testbench-config-editor]')),
      mode: 'new',
      name: '',
      boot() {

        this.editor = ace.edit(document.querySelector('[data-ace-editor="modalEditor"]'), {
          mode: 'ace/mode/json',
          showPrintMargin: false,
          tabSize: 2,
          theme: 'ace/theme/one_dark',
          value: "{\n\t\n}",
          wrap: true
        });

        this.editor.container.style.lineHeight = "1.4";
        this.editor.renderer.setScrollMargin(16, 16);
        this.editor.session.on("change", () => {
          this.json = this.editor.getValue();
        });
      
      },
      edit() {
        const configKey = Alpine.store('app').controls.config;
        this.name = configKey;
        this.mode = 'edit';
        this.json = Alpine.store('app').getConfig(configKey);
        this.editor.setValue(JSON.stringify(this.json, null, 2), -1);
        this.modal.show();
      },
      save(configKey, configJson) {
        Alpine.store('app').upsertConfig(configKey, configJson);
        this.modal.hide();
        this.reset();
      },
      makeConfigKey(str) {

        if (! str)
          str = this.name;

        return `custom.${str.toLowerCase().replace(/[^a-z0-9\-]/g, '-')}`;

      },
      new() {
        this.reset();
        this.modal.show();
      },
      reset() {
        this.editor.setValue("{\n\t\n}", -1);
        this.json = {};
        this.name = '';
        this.mode = 'new';
        this.errors = { json: null, name: null };
      }
    });

    Alpine.store('log', {
      tags: [],
      updatedTags: new Set(),
      addTag(tag) {
        tag.totalFired = 1;
        tag.triggerEvent = [tag.triggerEvent];
        this.tags.push(tag);
        this.updatedTags.add(tag.key);
      },
      addOrUpdateTag(tag) {
        const existingTag = this.findTag(tag.key);
        if (existingTag) {
          existingTag.totalFired++;
          existingTag.triggerEvent.push(tag.triggerEvent);
          this.updatedTags.add(existingTag.key);
        } else {
          this.addTag(tag);
        }
      },
      clearUpdatedTags() {
        this.updatedTags.clear();
      },
      findTag(key) {
        return this.tags.find(tag => tag.key === key);
      }
    }); 

    Alpine.store('app').boot();
    Alpine.store('editor').boot();

    document.addEventListener('cy:gtm.tag.fired', (event) => {

      if (! event.detail.key)
        return;

      Alpine.store('log').addOrUpdateTag(event.detail);

    });

    const init = () => {
      const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
      const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));  
      setMainMinHeight();
      bootManager();
    };
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }

  });
  
})();