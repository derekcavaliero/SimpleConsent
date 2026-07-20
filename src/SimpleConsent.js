/**!
 * SimpleConsent.js
 * 
 * Author: Derek Cavaliero (@derekcavaliero)
 * Repository: https://github.com/derekcavaliero/SimpleConsent
 * Version: {{package.version}}
 * License: MIT
 */
class SimpleConsent {

  static #instance = null;

  #_geo = null;
  #_multiConfig = null;
  #_name = 'SimpleConsent';
  #_namespace = 'simple-consent';
  #_version = '{{package.version}}';
  
  /**
   * A list of actions that are available to the user through the use of buttons added to the consent UI.
   * This list is used as a failsafe to prevent the user from calling methods that are not available,
   * and to prevent the configuration from adding new actions that are not supported by the library.
   * 
   * @private
   * @type {Array<string>}
   */
  #actions = [
    'acceptAll',
    'acceptSelected',
    'close',
    'denyAll',
    'saveSettings',
    'showSettings',
    'toggleServices'
  ];

  #config = {};

  /**
   * The main configuation object defaults for the consent manager.
   * The bulk of the functionality is driven by this object
   * 
   * This object is resolved through a fair bit of recursion and object merging. Any custom config will be merged with this object.
   * 
   * The most specific config will always take precedence over the default config. This includes multi-configuration objects where the user's geolocation matches N+1 configurations.
   * This config is written to be "safe" by design. If a user provides an invalid value, the library will default to the safest value (e.g. the most restrictive in terms of privacy).
   * 
   * Multi-configuration is supported by passing an object with a `_default` key and a `_router` key and any number of custom keys for each configuration.
   * The library will detect if a multi-config object is passed and resolve the appropriate config based on the user's geolocation (if a `geoLocate` function is provided).
   * 
   * @private
   * @type {Object}
   */
  #defaults = {

    /**
     * Actions
     * 
     * The actions object is used to configure the action buttons that are displayed in the consent UI.
     * Each action can be enabled or disabled by setting the value to `true` or `false`.
     * The order of the actions (left-to-right) can be customized by setting the `_order` array.
     */
    actions: {
      banner: {
        _order: ['showSettings', 'denyAll', 'acceptAll'],
        showSettings: true,
        denyAll: true,
        acceptAll: true,
      },
      modal: {
        _order: ['denyAll', 'saveSettings', 'acceptSelected', 'acceptAll'],
        acceptAll: true,
        acceptSelected: true,
        saveSettings: true,
        denyAll: true,
      },
    },

    /**
     * Consent Model
     * 
     * The consent model determines whether the user must opt-in or opt-out of services.
     * "opt-in" - The user must explicitly consent to each consent type.
     * "opt-out" - The user must explicitly decline each consent type.
     * 
     * @default string 'opt-in'
     */
    consentModel: 'opt-in',

    /**
     * If the user performs one of the actions listed in this array, they will be considered to have given consent.
     * Possible values: `''click', 'banner.close', scroll'`
     * 
     * @default boolean false
     */
    consentOn: false,

    /**
     * If set to true, the consent modal will be shown immediately and the user will be required 
     * to make a selection before using the website.
     * 
     * @default boolean false
     */
    consentRequired: false,

    /**
     * Content
     * 
     * This object contains the default content used in various parts of the consent manager UI.
     * It includes text for the banner, modal, and URLs for privacy-related documents.
     * 
     * @property {Object} content - The text object.
     * @property {Object} content.banner - The text content for the consent banner.
     * @property {string} content.banner.heading - The heading text for the banner.
     * @property {string} content.banner.description - The description text for the banner.
     * @property {Object} content.banner.actions - The action buttons text for the banner.
     * @property {string} content.banner.actions.acceptAll - The text for the "Accept All" button.
     * @property {string} content.banner.actions.denyAll - The text for the "Decline All" button.
     * @property {string} content.banner.actions.showSettings - The text for the "Edit Settings" button.
     * 
     * @property {Object} content.modal - The text content for the consent modal.
     * @property {string} content.modal.heading - The heading text for the modal.
     * @property {string} content.modal.description - The description text for the modal.
     * @property {string} content.modal.toggleAll - The text for the "Enable/Disable All" toggle.
     * @property {Object} content.modal.actions - The action buttons text for the modal.
     * @property {string} content.modal.actions.acceptAll - The text for the "Accept All" button.
     * @property {string} content.modal.actions.acceptSelected - The text for the "Accept Selected" button.
     * @property {string} content.modal.actions.denyAll - The text for the "Decline All" button.
     * @property {string} content.modal.actions.save - The text for the "Save" button.
     * 
     * @property {Object} content.urls - The URLs for privacy-related documents.
     * @property {string} content.urls.privacyPolicy - The URL for the privacy policy.
     * @property {string} content.urls.termsOfService - The URL for the terms of service.
     * @property {string} content.urls.cookiePolicy - The URL for the cookie policy.
     */
    content: {
      banner: {
        heading: 'Privacy Notice',
        description: 'This website uses cookies (or other browser storage) to deliver our services and/or analyze our website usage. This information is also shared with advertising partners through the use of tracking scripts/pixels.',
        actions: {
          acceptAll: 'Accept All',
          denyAll: 'Deny All',
          showSettings: 'Edit Preferences',
        },
      },
      links: {
        privacyPolicy: {
          text: 'Privacy Policy',
          url: '#',
        },
        termsOfService: null,
        cookiePolicy: {
          text: 'Cookie Policy',
          url: '#',
        },
      },
      modal: {
        heading: 'Your Privacy Choices',
        description: 'This website uses services that utilize storage features in your browser (via cookies or other browser storage functionality) to collect information. You can choose to grant or deny certain types of data collection using the controls below.',
        toggleAll: 'Enable/Disable All',
        actions: {
          acceptAll: 'Accept All',
          acceptSelected: 'Accept Selected',
          denyAll: 'Deny All',
          saveSettings: 'Save Preferences',
        },
      },
      notices: {
        required: {
          badge: 'Always Enabled',
        },
        gpc: {
          badge: 'Disabled by GPC',
          description: 'Some services have been automatically disabled to respect your Global Privacy Control opt-out signal.',
        },
      },
    },

    /**
     * Cookie Domain
     * 
     * The domain to set the consent cookie on. If null, the cookie domain will be set to the root domain.
     * 
     * @default null
     */
    cookieDomain: null, 

    /**
     * Cookie Expiry Days
     * 
     * The number of days that the consent cookie should be stored for.
     * 
     * @default integer 365
     */
    cookieExpiryDays: 365,          

    /**
     * @value {Function} geoLocate - A function that returns a promise that resolves to the user's geolocation.
     * @default null
     */
    geoLocate: null,

    /**
     * Used to configure settings specific to Google Tag Manager.
     */
    gtm: {
      containerId: null,
      loadContainer: false,
    },
    
    /**
     * Localization object
     * 
     * This object is used to store the translations for the consent manager. The following objects can be localized:
     * - services
     * - types
     * - ui
     * 
     * The object is keyed by the locale code (e.g., 'en', 'de', 'fr', etc.). The default locale is 'en'.
     * 
     * @property {Object} l10n - The localization object.
     * @property {Object} l10n.<locale> - The translations for a specific locale.
     * @property {Object} l10n.<locale>.services - An object of localized service objects.
     * @property {Object} l10n.<locale>.types - An object of localized type objects.
     * @property {Object} l10n.<locale>.content - An object containing localized UI content.
     * 
     * @example
     * {
     *   fr: {
     *     content: {},
     *     services: {},
     *     types: {},
     *   },
     * }
     * 
     * @default {}
     */
    l10n: {},

    /**
     * Locale
     * 
     * The locale code for the consent manager. This code is used to determine which localization to use (if available).
     * The locale is determined in the following order: 
     * 1. Explicitly set locale (e.g., 'en', 'de', 'fr', etc...)
     * 2. The locale code from the pages `lang` attribute (e.g., 'en-US', 'de-DE', 'fr-FR', etc...)
     * 3. If no locale is set, the default `text`, `services`, and `types` will be used.
     * 
     * @default null
     */
    locale: null,

    /** 
     * Callback: onInit
     * 
     * Called when the consent manager is initialized (e.g. after UI is booted).
     * @param {Object} [context] - The context object provided during initialization.
     * @default function(context) {}
     */
    onInit: function(settings) {},

    /** 
     * Callback: onUpdateAfter
     * 
     * Called after the consent settings are updated.
     * @param {Object} [settings] - The updated consent settings.
     * @default function(settings) {}
     */
    onUpdateAfter: function(settings) {},

    /** 
     * Callback: onUpdateBefore
     * 
     * Called before the consent settings are updated.
     * @param {Object} [settings] - The current consent settings before update.
     * @default function(settings) {}
     */
    onUpdateBefore: function(settings) {},

    /**
     * Services
     * 
     * An object of service objects that the website uses. 
     * Each service object should have the following properties:
     * 
     * @property {Object} services - The services object.
     * @property {Object} services.<service_key> - The settings for a given service.
     * @property {Object} services.<service_key>.name - The name of the service.
     * @property {Object} services.<service_key>.description - A short description of the service.
     * @property {Object} services.<service_key>.storage - An object containing the various storage (cookies etc..) for the service.
     * @property {Array<string>} services.<service_key>.types - An array of consent type keys that the service uses:
     * 
     * @default {}
     */
    services: {},

    /**
     * The method used to store the user's consent settings.
     * 
     * When set to 'cookie', the consent settings will be stored in a cookie only.
     * When set to 'localstorage', the consent settings will be stored in local storage only.
     * When set to 'hybrid', the consent settings will be stored in both a cookie and local storage.
     * 
     * @value {string} 'cookie'|'localstorage'|'hybrid'
     */
    storageMethod: 'hybrid',

    /**
     * The name used for the name of the cookie and/or localstorage key that stores the user's consent settings.
     * 
     * @default string 'simple_consent'
     */
    storageName: 'simple_consent',   

    /**
     * Templates
     * 
     * The templates object is used to store the HTML templates for the consent manager. 
     * You can customize any of the templates in this object, but you must keep the following data-attributes in the templates:
     * - data-consent-actions
     * - data-consent-action
     * - data-consent-settings
     * 
     * @property {Object} templates - The templates object.
     * @property {string} templates.banner - The HTML template for the consent banner.
     * @property {string} templates.modal - The HTML template for the consent modal.
     * @property {string} templates.type - The HTML template for the consent type.
     */
    templates: {
      banner: `
              <div class="consent-banner">
                <div class="consent-ui__content" role="alert" aria-labelledby="consentBannerHeading" aria-describedby="consentBannerDescription">
                  <div class="consent-ui__header">
                    <h2 class="consent-banner__heading" id="consentBannerHeading">
                      {{ heading }}
                    </h2>
                    <button aria-label="Close" data-consent-close></button>
                  </div>
                  <div class="consent-banner__description" id="consentBannerDescription">{{ description }}</div>
                  <div data-consent-notices></div>
                  <div data-consent-actions></div>
                  <div data-consent-links class="consent-ui__footer"></div>
                </div>
              </div>
              `,
      modal:  `
              <div class="consent-modal" aria-labelledby="consentModalHeading" aria-describedby="consentModalDescription">
                <div class="consent-ui__content">
                  <div class="consent-ui__header">
                    <h2 class="consent-modal__heading" id="consentModalHeading">{{ heading }}</h2>
                    <button aria-label="Close" data-consent-close></button>
                  </div>
                  <div class="consent-modal__description" id="consentModalDescription">{{ description }}</div>
                  <div data-consent-notices></div>
                  <form data-consent-settings>
                    <div data-consent-types class="consent-modal__body">
                    </div>
                    <div data-consent-actions></div>
                  </form>
                  <div data-consent-links class="consent-ui__footer"></div>
                </div>
              </div>
              `,
      notice: `
              <div>
                {{ description }}
              </div>
              `,
      service: `
                <div> 
                  <dt>{{ name }}</dt>
                  <dd>{{ description }}</dd>
                </div>
               `,
      settingsButton: `
                      <button>
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" width="24px" viewBox="0 -960 960 960" fill="currentColor" style="pointer-events: none">
                          <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-75 29-147t81-128.5q52-56.5 125-91T475-881q21 0 43 2t45 7q-9 45 6 85t45 66.5q30 26.5 71.5 36.5t85.5-5q-26 59 7.5 113t99.5 56q1 11 1.5 20.5t.5 20.5q0 82-31.5 154.5t-85.5 127q-54 54.5-127 86T480-80Zm-60-480q25 0 42.5-17.5T480-620q0-25-17.5-42.5T420-680q-25 0-42.5 17.5T360-620q0 25 17.5 42.5T420-560Zm-80 200q25 0 42.5-17.5T400-420q0-25-17.5-42.5T340-480q-25 0-42.5 17.5T280-420q0 25 17.5 42.5T340-360Zm260 40q17 0 28.5-11.5T640-360q0-17-11.5-28.5T600-400q-17 0-28.5 11.5T560-360q0 17 11.5 28.5T600-320ZM480-160q122 0 216.5-84T800-458q-50-22-78.5-60T683-603q-77-11-132-66t-68-132q-80-2-140.5 29t-101 79.5Q201-644 180.5-587T160-480q0 133 93.5 226.5T480-160Zm0-324Z"/>
                        </svg>
                      </button>
                      `,
      type:   `
              <div class="consent-type">
                <input type="checkbox" role="switch" id="type-{{ key }}" name="{{ key }}">
                <div class="consent-type__text">
                  <div class="consent-type__header">
                    <label for="type-{{ key }}">{{ name }}</label>
                  </div>
                  <div class="consent-type__desc">{{ description }}</div>
                  <dl data-consent-type-services></dl>
                </div>
              </div>
              `,
    },

    types: {},

    /**
     * UI
     * 
     * This object contains settings for the consent manager UI.
     * It allows customization of action button classes, banner placement, etc...
     * 
     * @property {Object} ui - The ui settings object.
     * @property {string|null} ui.actionClasses - CSS classes to be applied to action buttons. If `null`, default classes are used.
     * @property {Object} ui.placement - The placement settings for the banner.
     * @property {Array<string>} ui.placement.banner - An array specifying the position of the banner. Possible values include 'top', 'bottom', 'left', 'right'.
     */
    ui: {
      actionClasses: {
        _all: null,
        acceptAll: null,
        acceptSelected: null,
        denyAll: null,
        showSettings: null,
        saveSettings: null,
      },
      placement: {
        banner: ['bottom', 'left'],
        settingsButton: ['bottom', 'left'],
      },
      rootClass: 'simple-consent',
      rootId: 'simple-consent',
      showBranding: true,
      // @todo: 
      // Determine if its worth investigating another free logo API. Not hugely important but a nice UX feature.
      // showServiceLogos: false,
    },

  };

  /**
   * Settings
   * 
   * Holds the consent settings for the consent manager.
   * The settings object is a key-value pair where the key is the consent type and the value is a boolean indicating whether the user has consented.
   * Any keys starting with an underscore (_) are reserved for internal use (e.g., _gpc for Global Privacy Control or _geo for geolocation etc...).
   * 
   * @private
   * @type {Object|null}
   */
  #settings = null;

  /**
   * Stores references to the global privacy signals set by the user's browser.
   * 
   * @private
   */
  #signals = {
    gpc: navigator.globalPrivacyControl || false,
    dnt: navigator.doNotTrack || false,
  };

  /**
   * Holds the types of consent that are available to the user in the settings modal.
   * This object sets a default type of "necessary" which every implementation should have.
   * 
   * This object can be extended via the user provided config using its `types` property.
   * 
   * @private
   * @type {Object}
   */
  #types = {
    necessary: {
      key: 'necessary',
      name: 'Strictly Necessary',
      description: 'These cookies/services are required for our website(s) to function properly and cannot be disabled.',
      required: true,
    }
  };

  /**
   * UI Elements
   * 
   * This private property is an object used to store references to the DOM nodes created by the consent manager.
   * Each property within this object will hold a reference to specific DOM node(s).
   * 
   * @private
   * @type {Object}
   * @property {HTMLElement|null} banner - Reference to the banner DOM node.
   * @property {HTMLElement|null} modal - Reference to the modal DOM node.
   * @property {HTMLElement|null} root - Reference to the root DOM node.
   * @property {HTMLElement|null} settings - Reference to the settings DOM node.
   */
  #ui = {
    banner: null,
    modal: null,
    root: null,
    settings: null,
    settingsButton: null,
  };

  constructor(config) {

    console.time(`⏱️ ${this.#class}`);

    if (SimpleConsent.#instance) 
      return SimpleConsent.#instance;

    SimpleConsent.#instance = this;

    try {
      this.#resolveConfig(config);
    } catch (error) {
      console.error(`${this.#class}: Config resolution error:`, error);
    }

    console.timeEnd(`⏱️ ${this.#class}`);

  }

  get #class() {
    return this.constructor.name;
  }

  get #servicesByType() {

    const services = {};
    
    for (let [serviceKey, service] of Object.entries(this.#config.services)) {

      for (let type of service.types) {
        
        if (! services[type])
          services[type] = [];
        
        services[type].push(service);

      }
      
    }

    return services;

  }

  get config() {
    return this.#config;
  }

  get signals() {
    return this.#signals;
  }

  get storage() {

    if (this.#settings) 
      return this.#settings;

    if (['localstorage', 'hybrid'].includes(this.#config.storageMethod)) {

      let settings = localStorage.getItem(this.#config.storageName);

      if (settings) {
        this.#settings = JSON.parse(settings);
        return this.#settings;
      }

    }
    
    if (['cookie', 'hybrid'].includes(this.#config.storageMethod)) {

      let name = `${this.#config.storageName}=`;
      let decodedCookie = decodeURIComponent(document.cookie);
      let ca = decodedCookie.split(';');

      for (let i = 0; i <ca.length; i++) {

        let c = ca[i];

        while (c.charAt(0) == ' ')
          c = c.substring(1);
        
        if (c.indexOf(name) == 0) 
          return JSON.parse(c.substring(name.length, c.length));
        
      }

    }
      
    return null;

  } 

  async #resolveConfig(config) {
    
    if (config._default) {

      this.#_multiConfig = config;
      config = config._default;

      this.#config = this.#deepMerge(this.#defaults, config);

      let router = this.#_multiConfig._router;

      if (! router)
        console.warn(`${this.#class}: No "_router" found in multi-config object. Will default to base config.`);

      if (this.#config.geoLocate && typeof this.#config.geoLocate == 'function') {

        this.#config.geoLocate().then((geo) => {

          this.#_geo = geo;

          if (! router) {
            this.#init();
            return;
          }

          router.forEach((route) => {
            
            if (! route.geoMatch)
              return;

            let expression = new RegExp(route.geoMatch);

            if (expression.test(geo) && this.#_multiConfig.hasOwnProperty(route.config))
              this.#config = this.#deepMerge(this.#config, this.#_multiConfig[route.config]);

          });

          this.#init();

        });

      }

    } else {
      this.#config = this.#deepMerge(this.#defaults, config);
      this.#init();
    }

  }

  #init() {
    
    this.#config.cookieDomain = this.#resolveCookieDomain();
    this.#types = this.#deepMerge(this.#types, this.#config.types);

    this.#gtmSetDataLayer();

    this.#bindCustomEvents();

    this.#loadSettings();
    this.#gtmLoadConainer();
    
    this.#bindExplicitActions();
    this.#bindImplicitActions();
    
    this.#maybeLocalize();
    this.mount();

    if (typeof this.#config.onInit == 'function') {
      this.#config.onInit(this.#settings);
      this.#emit('init', this.#settings);
    }

  }

  /* -------------
   * Private API
   * ------------- */

  #bindCustomEvents() {

    document.addEventListener(`${this.#_namespace}:modal.show.before`, (e) => {

      const actions = e.detail.querySelectorAll('[data-consent-action]');

      if (! this.#settings._datetime) {

        actions.forEach((action) => {
          action.style.display = (action.getAttribute('data-consent-action') !== 'saveSettings') ? 'block' : 'none';
        });

        this.hide('banner');

        return;

      }

      actions.forEach((action) => {
        action.style.display = (action.getAttribute('data-consent-action') !== 'saveSettings') ? 'none' : 'block';
      });

    });

    document.addEventListener(`${this.#_namespace}:modal.close.before`, (e) => {

      if (! this.#settings._datetime)
        this.show('banner');

    });

    document.addEventListener(`${this.#_namespace}:settings.update`, (e) => {
      this.#gtmPush('update');
      this.show('settingsButton');
    });

    document.addEventListener(`${this.#_namespace}:settings.load`, (e) => {
      this.#gtmPush('default');
    });

  }

  #bindExplicitActions() {

    document.addEventListener('keyup', (e) => {
      
      if (e.key !== 'Escape') 
        return;

      if (this.#ui.modal && this.#ui.modal.hasAttribute('aria-expanded'))
        this.#ui.modal.querySelector('[data-consent-close]').click();

    });

    document.addEventListener('click', (e) => {

      /**
       * @important!
       * 
       * Chrome (and possibly other browsers) wrap text in <font> when the native browser translation feature is used.
       * When that happens - the target element is the <font> element and not the actual element that the user clicked #footgun
       * So we always scope the target to the closest element with the data-consent-action attribute.
       */
      let actionTarget = e.target.closest('[data-consent-action]');

      if (actionTarget) {
        
        e.preventDefault();

        this[{
          showSettings: 'show',
          acceptAll: 'accept',
          acceptSelected: 'save',
          denyAll: 'deny',
          saveSettings: 'save',
        }[actionTarget.dataset.consentAction]]();

        return;
        
      }        

      if (e.target.hasAttribute('data-consent-close')) {
        e.preventDefault();
        this.#close(e.target);
      }

      if (e.target.hasAttribute('data-consent-toggle-services')) {
        e.preventDefault();
        this.#toggleServices(e.target);
      }

    });

  }

  #bindImplicitActions() {

    // We only want to bind the listeners if the user has not already set their preferences
    // and if the consentOn array is not empty/falsy.
    if (! this.#config.consentOn || this.#settings._datetime)
      return;

    const consentToAll = () => {
      this.changeAll();
      this.save(true);

      removeEventListeners();
    }

    const debounce = (func, wait) => {
      
      let timeout;
      
      return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };

    }

    const acceptOnScroll = (e) => {

      if (window.scrollY < (window.innerHeight * 0.05))
        return;

      consentToAll();

    }
  
    const debouncedAcceptOnScroll = debounce(acceptOnScroll, 100);

    if (this.#config.consentOn.includes('scroll'))
      document.addEventListener('scroll', debouncedAcceptOnScroll);

    const acceptOnBodyClick = (e) => {
      
      if (e.target.closest('[data-consent-tpl]')) 
        return;

      consentToAll();

    }

    if (this.#config.consentOn.includes('click'))
      document.addEventListener('mousedown', acceptOnBodyClick);

    const acceptOnClose = (e) => {
      consentToAll();
    }

    if (this.#config.consentOn.includes('banner.close'))
      document.addEventListener(`${this.#_namespace}:banner.close.after`, acceptOnClose);

    const removeEventListeners = () => {
      document.removeEventListener('mousedown', acceptOnBodyClick);
      document.removeEventListener(`${this.#_namespace}:banner.close.after'`, acceptOnClose);
      document.removeEventListener('scroll', acceptOnScroll);
    }

  }

  #boolToStatus(bool) {
    return bool ? 'granted' : 'denied';
  }

  #bulkSetAttributes(element, attributes) {
    for (const key in attributes) {
      if (! attributes.hasOwnProperty(key)) continue;
      element.setAttribute(key, attributes[key]);
    }
  }

  #convertSettingsToStatusObject() {

    let obj = {};
      
    if (this.#settings) {

      for (let setting in this.#settings) {
        
        if (! this.#settings.hasOwnProperty(setting) || setting.startsWith('_')) 
          continue;

        obj[setting] = this.#boolToStatus(this.#settings[setting]);

        if (this.#types[setting] && this.#types[setting].mapTo) {
          this.#types[setting].mapTo.forEach((mappedSetting) => {
            obj[mappedSetting] = this.#boolToStatus(this.#settings[setting]);
          });
        }
      
      }

    }

    return obj;

  }

  #close(target) {

    if (this.#config.consentRequired && ! this.#settings)
      return;

    const element = target.closest('[data-consent-tpl]');

    if (! element)
      return;

    this.#emit(`${element.dataset.consentTpl}.close.before`, element);

    element.removeAttribute('aria-expanded');

    this.#emit(`${element.dataset.consentTpl}.close.after`, element);

  }

  #deepMerge(target, source) {
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (Array.isArray(source[key])) {
          target[key] = source[key].slice();
        } else if (typeof source[key] === 'object' && source[key] !== null) {
          if (!target[key]) {
            target[key] = {};
          }
          this.#deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }
    return target;
  }

  #eatCookies() {
    const cookies = document.cookie.split(';');

    cookies.forEach(cookie => {

      const cookieName = cookie.split('=')[0].trim();

      const matchesPattern = patterns.some(pattern => {
        const regex = new RegExp(pattern);
        return regex.test(cookieName);
      });

      if (matchesPattern) 
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      
    });
  }

  #getCookieMatchPatterns() {
    return Object.values(this.#config.services).reduce((acc, service) => {
      return acc.concat(service.cookies.map(cookie => cookie.name));
    }, []);
  }

  #getType(key) {
    return this.#types[key] || false;
  }

  #gtmSetDataLayer() {

    window.dataLayer = window.dataLayer || [];

    if (! window.gtag)
      window.gtag = function() { window.dataLayer.push(arguments); }

  }

  #gtmLoadConainer() {
    
    if (! this.#config.gtm.loadContainer || ! this.#config.gtm.containerId)
      return;

    (function(w, d, s, l, i){
  
      w[l]=w[l]||[];
      w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
    
      var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),
          dl=l!='dataLayer'?'&l='+l:'';
    
      j.async=true;
      j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
      f.parentNode.insertBefore(j,f);
      
    })(window, document, 'script', 'dataLayer', this.#config.gtm.containerId);

  }

  #gtmPush(event) {

    let consentStatus = this.#convertSettingsToStatusObject();

    let dataLayerEvent = {
      'default': 'load',
    }[event] || event;

    window.gtag('consent', event, consentStatus);

    let payload = {
      event: `${this.#_namespace}:${dataLayerEvent}`,
      consent: consentStatus,
      consentMeta: {
        model: this.#config.consentModel,
        geo: this.#_geo,
        gpc: this.#signals.gpc,
      },
    };

    // payload = Object.assign(payload, consentStatus);

    window.dataLayer.push(payload);

    this.#emit('datalayer.push', payload);

  }

  #emit(eventName, detail) {
    const event = new CustomEvent(`${this.#_namespace}:${eventName}`, { detail });
    document.dispatchEvent(event);
  }

  #hideAll() {
    this.hide('modal');
    this.hide('banner');
  }

  #loadSettings() {
      
    this.#settings = this.storage;
    
    // If we have settings, we don't need to do anything else.
    if (this.#settings) {
      this.#emit('settings.load', this.#settings);
      return;
    }
    
    this.#settings = {};

    this.#config.consentModel = this.#config.consentModel.toLowerCase().trim();

    // Saftey net for invalid consentModel values
    if (! ['opt-in', 'opt-out'].includes(this.#config.consentModel)) {
      console.info(`⚠️ ${this.#class}: Invalid consentModel config value "${this.#config.consentModel}". Defaulting to "opt-in".`);
      this.#config.consentModel = 'opt-in';
    }

    let defaultSetting = {
      'opt-in': false,
      'opt-out': true,
    }[this.#config.consentModel];

    // Respect the user's Global Privacy Control setting
    // @todo - make sure that we can fine-tune by type if desired.
    if (this.#signals.gpc) {
      defaultSetting = this.#signals.gpc ? false : defaultSetting;
      console.info(`ℹ️ ${this.#class}: GPC signal detected, setting applicable types to "denied" (false)`, this.#settings);
    } else {
      console.info(`ℹ️ ${this.#class}: Settings determined by "${this.#config.consentModel}" consentModel`, this.#settings);
    }

    for (let [typeKey, type] of Object.entries(this.#types)) {
      this.#settings[typeKey] = type.required ? true : defaultSetting;
    }

    this.#emit('settings.load', this.#settings);

  }

  /**
   * Responsible for:
   * - Checking if a default locale is set in the config.
   * - Extracting the current language code from the `<html>` "lang" attribute (if no explicit locale is set in the config).
   * - Localizing the consent manager UI based on the locale and `l10n` config object (if defined).
   * 
   * If no localization possible given the above, the default text will be used.
   * 
   * @todo Implement localization for services and types.
   * 
   * @returns {void}
   */
  #maybeLocalize() {
      
    if (! this.#config.l10n)
      return;

    if (! this.#config.locale) {
      const lang = document.documentElement.lang;
      this.#config.locale = lang || null;
    }

    if (! this.#config.locale) {
      console.info(`ℹ️ ${this.#class}: No locale set or detected on html "lang" attribute.`);
      return;
    }

    this.#config.locale = this.#config.locale.toLowerCase();

    const l10n = this.#config.l10n[this.#config.locale];

    if (! l10n) {
      console.info(`ℹ️ ${this.#class}: No l10n key found for "${this.#config.locale}".`);
      return;
    }

    if (l10n.content) 
      this.#config.content = this.#deepMerge(this.#config.content, l10n.content);

    if (l10n.services)
      this.#config.services = l10n.services;

    if (l10n.types)
      this.#types = l10n.types;
  }

  /**
   * Reponsible for mounting the consent manager UI to the DOM.
   * Calls sub-methods for mounting the modal, banner, and their appropriate actions.
   * 
   * @returns {void}
   */
  mount() {

    this.#mountStyles();

    const root = document.getElementById(this.#config.ui.rootId) || document.createElement('div');
    root.id = this.#config.ui.rootId;
    
    root.className = this.#config.ui.rootClass;

    // Modal
    this.#ui.modal = this.#parseTemplate('modal', this.#config.content.modal);
    this.#bulkSetAttributes(this.#ui.modal, {
      'role': 'dialog',
    });

    this.#mountActions(this.#ui.modal);
    this.#mountConsentTypes(this.#settings, this.#ui);

    root.appendChild(this.#ui.modal);

    // Banner
    this.#ui.banner = this.#parseTemplate('banner', this.#config.content.banner);
    this.#mountActions(this.#ui.banner);
    
    this.#bulkSetAttributes(this.#ui.banner, { 
      'role': 'alert',
      'data-consent-placement': this.#config.ui.placement.banner.join(','),
    });

    root.appendChild(this.#ui.banner);

    if (this.#signals.gpc) {
      let targets = root.querySelectorAll('[data-consent-notices]');

      for (let target of targets) {
        let notice = this.#parseTemplate('notice', this.#config.content.notices.gpc);
        this.#bulkSetAttributes(notice, { 
          'data-consent-tpl': 'notice',
          'data-consent-notice': 'info',
        });
        target.appendChild(notice);
      }
    }

    this.#mountLinks(root);

    this.#ui.settingsButton = this.#parseTemplate('settingsButton', {});
    this.#bulkSetAttributes(this.#ui.settingsButton, { 
      'role': 'dialog',
      'data-consent-tpl': 'settingsButton',
      'data-consent-action': 'showSettings',
      'data-consent-placement': this.#config.ui.placement.settingsButton.join(','),
      'title': 'Edit Preferences',
    });

    root.appendChild(this.#ui.settingsButton);

    // Root
    document.body.appendChild(root);
    this.#ui.root = root;

    // Show the appropriate UI based on config + the state of the users settings.
    // e.g. if the user has already set their preferences, we don't need to show the banner.
    this.#showOnMount();

  }

  #mountActions(element) {
      
    const template = element.dataset.consentTpl;
    const actions = this.#config.actions[template];
    const target = element.querySelector('[data-consent-actions]');

    if (! target) {
      console.info(`ℹ️ ${this.#class}: Template Error - "${template}" does not contain a [data-consent-actions] target.`);
      return;
    }

    for (let prop of this.#config.actions[template]._order) {
      
      if (!actions.hasOwnProperty(prop) || !actions[prop] || !this.#actions.includes(prop))
        continue;
  
      let action = document.createElement('button');

      if (this.#config.ui.actionClasses._all)
        action.classList.add(...this.#config.ui.actionClasses._all.split(' '));
  
      if (this.#config.ui.actionClasses[prop]) {
        action.classList.add(...this.#config.ui.actionClasses[prop].split(' '));
      }
  
      action.setAttribute('data-consent-action', prop);
      action.textContent = this.#config.content[template].actions[prop];
  
      target.append(action);
    }

  }

  #mountConsentTypes() {

    const services = this.#servicesByType;

    for (let [typeKey, type] of Object.entries(this.#types)) {

      this.#types[typeKey].key = typeKey;

      const tpl = this.#parseTemplate('type', type);

      this.#bulkSetAttributes(tpl, { 
        'data-consent-type': typeKey
      });

      const input = tpl.querySelector('input');

      input.checked = this.#settings[typeKey] ? true : false;

      if (type.required) {
        input.disabled = true;
        input.checked = true;
      }

      if (this.#signals.gpc && type.gpc) {
        input.disabled = true;
        input.checked = false;
        input.title = this.#config.content.notices.gpc.description;
      }

      if (services[typeKey]) {

        const servicesToggle = document.createElement('button');
        servicesToggle.textContent = `${services[typeKey].length} Service${services[typeKey].length > 1 ? 's' : ''}`;
        servicesToggle.setAttribute('data-arrow', '↓');
        servicesToggle.setAttribute('data-consent-toggle-services', typeKey);

        // @bug - this needs to be reworked to be less fragile.
        tpl.querySelector('.consent-type__header').appendChild(servicesToggle);

        const servicesTarget = tpl.querySelector('[data-consent-type-services]');

        this.#bulkSetAttributes(servicesTarget, {
          'role': 'list',
          'data-consent-tpl': 'services',
        });

        for (let service of services[typeKey]) {
          let serviceTpl = this.#parseTemplate('service', service);
          servicesTarget.appendChild(serviceTpl);
        }
      }

      this.#ui.modal.querySelector('[data-consent-types]').appendChild(tpl);

    }

    this.#ui.settings = this.#ui.modal.querySelectorAll('[data-consent-settings] input');

  }

  #mountLinks(element) {
      
    const links = this.#config.content.links;
    const targets = element.querySelectorAll('[data-consent-links]');

    if (!targets.length)
      return;
    
    for (let target of targets) {
      
      let linkCount = 0;

      for (let link in links) {

        if (!links.hasOwnProperty(link) || !links[link])
          continue;
    
        if (linkCount > 0) {
          let delimiter = document.createElement('span');
          delimiter.setAttribute('data-consent-link-delimiter', '');
          target.appendChild(delimiter);
        }
    
        let a = document.createElement('a');
        a.href = links[link].url;
        a.textContent = links[link].text;
    
        target.appendChild(a);
        
        linkCount++;

      }

      if (target.closest('[data-consent-tpl="modal"]') && this.#config.ui.showBranding) {
        let a = document.createElement('a');
        a.setAttribute('data-consent-branding', '');
        a.href = 'https://github.com/derekcavaliero/SimpleConsent/';
        a.target = '_blank';
        a.textContent = `${this.#_name}`;
        target.appendChild(a);
      }

    }
  }

  #mountStyles() {

    const styleId = `${this.#_namespace}-styles`;
    let styles = document.getElementById(styleId);

    if (styles)
      return;

    styles = document.createElement('style');
    styles.id = styleId;
    
    styles.textContent = `
      [data-consent-tpl][role] { display: none; }
      [data-consent-tpl][role][aria-expanded] { display: flex !important; }
      [data-consent-tpl][role][aria-expanded] ~ [aria-expanded] { display: none !important; }
    `;
    
    document.head.appendChild(styles);

  }

  /**
   * Parses a template string from the config and replaces placeholders with content.
   * 
   * @param {string} template - The key of the template to parse from the `#config.templates` object.
   * @param {Object} content - The content object to replace placeholders in the template.
   * 
   * @returns {HTMLElement} The parsed template as a DOM node.
   */
  #parseTemplate(template, content = {}) {

    const tpl = document.createElement('template');
    tpl.innerHTML = this.#config.templates[template].trim();

    for (let placeholder in content) {

      if (! content.hasOwnProperty(placeholder) || ['actions', 'required'].includes(placeholder))
        continue;

      if (typeof content[placeholder] !== 'string')
        continue;

      // let pattern = new RegExp(`{{ ${placeholder} }}`, 'g');
      // let sanitized = content[placeholder].replace(/<\/?[^>]+(>|$)/g, '');
      // tpl.innerHTML = tpl.innerHTML.replace(pattern, sanitized);

      tpl.innerHTML = this.#safelyReplaceToken(tpl.innerHTML, placeholder, content[placeholder]);

    }

    this.#bulkSetAttributes(tpl.content.firstChild, {
      'data-consent-tpl': template
    });
    
    return tpl.content.firstChild;

  }

  #resolveCookieDomain() {
    if (this.#config.cookieDomain) 
        return this.#config.cookieDomain;

    const hostname = window.location.hostname;

    if (hostname === 'localhost')
      return '';

    const domainParts = hostname.split('.').reverse();

    // Handle TLDs with two segments (e.g., co.uk)
    let rootDomain = domainParts[1] + '.' + domainParts[0];
    if (domainParts.length > 2 && domainParts[1].length <= 3) {
        rootDomain = domainParts[2] + '.' + rootDomain;
    }

    return rootDomain;
  }

  #safelyReplaceToken(tpl, token, content) {

    let pattern = new RegExp(`{{ ${token} }}`, 'g');
    let sanitized = content.replace(/<[^>]*>?/gm, '');
    sanitized = this.#sanitizeHTML(sanitized);

    return tpl.replace(pattern, sanitized);

  }

  #sanitizeHTML(unsafeText) {
    return unsafeText
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
  }

  #showOnMount() {

    const consentRequired = this.#config.consentRequired;
    const hasStoredSettings = this.#settings._datetime;

    if (hasStoredSettings) {
      this.show('settingsButton');
      return;
    }

    if (! consentRequired) {
      this.show('banner');
    } else {
      this.show('modal');
    }

  }

  #store(data) {
    if (['cookie', 'hybrid'].includes(this.#config.storageMethod))
      document.cookie = `${this.#config.storageName}=${JSON.stringify(data)}; expires=${new Date(Date.now() + (this.#config.cookieExpiryDays * 24 * 60 * 60 * 1000)).toUTCString()}; path=/; domain=${this.#config.cookieDomain}`;

    if (['localstorage', 'hybrid'].includes(this.#config.storageMethod))
      localStorage.setItem(this.#config.storageName, JSON.stringify(data));
  }

  #storePurge() {
    localStorage.removeItem(this.#config.storageName);
    document.cookie = `${this.#config.storageName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${this.#config.cookieDomain}`;
  }

  #toggleServices(target) {

    const arrow = target.getAttribute('data-arrow');
    target.setAttribute('data-arrow', arrow === '↓' ? '↑' : '↓');

    const type = target.closest('[data-consent-tpl="type"]');
    const services = type.querySelector(`[data-consent-type-services]`);
    services.toggleAttribute('aria-expanded');

  }
  
  /* -------------
   * Public API
   * ------------- */

  accept() {
    this.changeAll();
    this.save();
  }

  changeAll(value = true) {
    this.#ui.settings.forEach((input) => {
      if (!input.disabled)
        input.checked = value;
    });
  }

  deny() {
    this.changeAll(false);
    this.save();
  }

  destroy() {
    this.#emit('destroy');
    this.#ui.root.remove();
    this.#storePurge();
    if (SimpleConsent.#instance) {
      SimpleConsent.#instance = null;
    }
  }

  hide(uiKey = 'modal') {

    if (this.#config.consentRequired && ! this.#settings)
      return;

    this.#ui[uiKey].removeAttribute('aria-expanded');

  }

  reset() {

    this.#emit('reset');
    
    this.#storePurge();

    this.#settings = null;

    this.#loadSettings();
    this.#bindImplicitActions();

    // @bug - this needs adjusted to read the default settings and update the UI accordingly. 
    // It won't always be as simple as just setting the defaults based on the consentModel.
    this.changeAll((this.#config.consentModel === 'opt-in') ? false : true);

    this.#showOnMount();

  }

  save(implicit = false) {

    if (typeof this.#config.onUpdateBefore == 'function') 
      this.#config.onUpdateBefore(this.#settings);

    if (! this.#settings)
      this.#settings = {};

    for (let input of this.#ui.settings) {

      if (input.name == 'necessary')
        continue; // we don't need to store the necessary setting - it's always true.
      
      const type = this.#getType(input.name);

      this.#settings[input.name] = input.checked;

      if (type.mapTo && Array.isArray(type.mapTo)) {
        type.mapTo.forEach((type) => {
          this.#settings[type] = input.checked;
          this.#emit(`${type}.${this.#boolToStatus(input.checked)}`);
        });
      }

      let status = input.checked ? 'granted' : 'denied';
      this.#emit(`${input.name}.${this.#boolToStatus(input.checked)}`);

    }

    Object.entries({
      _datetime: new Date().toISOString(),
      _id: crypto.randomUUID(),
      _geo: this.#_geo,
      _gpc: this.#signals.gpc,
      _model: `${this.#config.consentModel}/` + (implicit ? 'implicit' : 'explicit'),
      _version: this.#_version,
    }).forEach(([key, value]) => {
      this.#settings[key] = value;
    });

    this.#store(this.#settings);

    this.#emit('settings.update', this.#settings);

    if (typeof this.#config.onUpdateAfter == 'function') 
      this.#config.onUpdateAfter(this.#settings);

    setTimeout(() => this.#hideAll(), 150);

  }

  show(uiKey = 'modal') {

    this.#emit(`${uiKey}.show.before`, this.#ui[uiKey]);
    this.#ui[uiKey].setAttribute('aria-expanded', 'true');
    this.#emit(`${uiKey}.show.after`, this.#ui[uiKey]);

  }

  /* -------------
   * Static API
   * ------------- */

  static manager(config) {

    if (!SimpleConsent.#instance) 
      SimpleConsent.#instance = new SimpleConsent(config);
    
    return SimpleConsent.#instance;

  }

}

// Auto-boot behavior: only run when loaded as a script tag (not when imported as a module)
// This allows the library to work both as a script tag and as an ES module
// When imported as a module, users can manually initialize: `new SimpleConsent(config)`
// When loaded as a script tag, it will auto-boot if a script tag with data-consent-config exists
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  
  document.addEventListener('DOMContentLoaded', () => {

    // Only auto-boot if we find a script tag with data-consent-config
    // This script tag won't exist when the library is imported as a module
    const script = document.querySelector('script[data-consent-config]');

    if (! script) 
      return;

    let config = window[script.dataset.consentConfig] || {};

    new SimpleConsent(config);

    delete window[script.dataset.consentConfig];
    
  });

  if (! window.SimpleConsent)
    window.SimpleConsent = SimpleConsent;

}

// Export for ES modules
export default SimpleConsent;
export { SimpleConsent };