#!/usr/bin/env node

/**
 * Allyabase Bootstrap Service
 * 
 * Handles base discovery, announcements, and initial configuration
 * Integrates with fedwiki for configuration management
 */

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { CronJob } = require('cron');
const winston = require('winston');
const { Validator } = require('jsonschema');
const sessionless = require('sessionless-node');

// Configuration
const CONFIG_FILE = process.env.BOOTSTRAP_CONFIG || path.join(__dirname, '../bootstrap-config.json');
const SCHEMA_FILE = path.join(__dirname, '../bootstrap-config-schema.json');
const DEFAULT_CONFIG_FILE = path.join(__dirname, '../bootstrap-config-default.json');
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const PORT = process.env.BOOTSTRAP_PORT || 4242;

// Logger setup
const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'allyabase-bootstrap' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

class AllyabaseBootstrap {
  constructor() {
    this.config = null;
    this.schema = null;
    this.validator = new Validator();
    this.announcementJobs = new Map();
    this.sessionless = null;
  }

  async initialize() {
    logger.info('🚀 Starting Allyabase Bootstrap Service...');
    
    try {
      // Load configuration schema
      this.schema = await fs.readJson(SCHEMA_FILE);
      logger.info('✅ Configuration schema loaded');

      // Load or create configuration
      await this.loadConfiguration();
      
      // Initialize sessionless
      await this.initializeSessionless();
      
      // Validate configuration
      this.validateConfiguration();
      
      // Set up announcement jobs
      await this.setupAnnouncementJobs();
      
      // Start HTTP server for health checks and API
      this.startServer();
      
      // Perform initial announcements
      if (this.config.bootstrap.autoAnnounce) {
        await this.performInitialAnnouncements();
      }
      
      logger.info('🎉 Bootstrap service initialized successfully');
      
    } catch (error) {
      logger.error('❌ Failed to initialize bootstrap service:', error);
      process.exit(1);
    }
  }

  async loadConfiguration() {
    try {
      if (await fs.pathExists(CONFIG_FILE)) {
        this.config = await fs.readJson(CONFIG_FILE);
        logger.info(`✅ Configuration loaded from ${CONFIG_FILE}`);
      } else {
        // Create default configuration
        const defaultConfig = await fs.readJson(DEFAULT_CONFIG_FILE);
        this.config = defaultConfig;
        await fs.writeJson(CONFIG_FILE, defaultConfig, { spaces: 2 });
        logger.info(`✅ Created default configuration at ${CONFIG_FILE}`);
      }
    } catch (error) {
      logger.error('❌ Failed to load configuration:', error);
      throw error;
    }
  }

  async initializeSessionless() {
    try {
      // Generate keys if not provided
      const keys = await sessionless.generateKeys();
      this.sessionless = sessionless;
      this.keys = keys;
      logger.info(`✅ Sessionless initialized with public key: ${keys.pubKey}`);
    } catch (error) {
      logger.error('❌ Failed to initialize sessionless:', error);
      throw error;
    }
  }

  validateConfiguration() {
    const result = this.validator.validate(this.config, this.schema);
    
    if (!result.valid) {
      const errors = result.errors.map(e => `${e.property}: ${e.message}`).join(', ');
      throw new Error(`Configuration validation failed: ${errors}`);
    }
    
    logger.info('✅ Configuration validation passed');
  }

  async setupAnnouncementJobs() {
    const { announcementInterval, retryInterval } = this.config.bootstrap;
    
    // Set up periodic announcements
    if (announcementInterval > 0) {
      const cronPattern = this.minutesToCron(announcementInterval);
      const announcementJob = new CronJob(cronPattern, () => {
        this.performAnnouncements().catch(error => {
          logger.error('❌ Scheduled announcement failed:', error);
        });
      }, null, true);
      
      this.announcementJobs.set('periodic', announcementJob);
      logger.info(`✅ Periodic announcements scheduled every ${announcementInterval} minutes`);
    }
    
    // Set up retry job for failed announcements
    if (this.config.bootstrap.retryFailedAnnouncements && retryInterval > 0) {
      const retryCronPattern = this.minutesToCron(retryInterval);
      const retryJob = new CronJob(retryCronPattern, () => {
        this.retryFailedAnnouncements().catch(error => {
          logger.error('❌ Retry announcements failed:', error);
        });
      }, null, true);
      
      this.announcementJobs.set('retry', retryJob);
      logger.info(`✅ Failed announcement retries scheduled every ${retryInterval} minutes`);
    }
  }

  async performInitialAnnouncements() {
    logger.info('📢 Performing initial base announcements...');
    await this.performAnnouncements();
  }

  async performAnnouncements() {
    const { announceToBase } = this.config.networking;
    
    for (const targetBase of announceToBase) {
      if (!targetBase.enabled) {
        continue;
      }
      
      try {
        await this.announceToBase(targetBase);
        logger.info(`✅ Successfully announced to ${targetBase.name}`);
      } catch (error) {
        logger.error(`❌ Failed to announce to ${targetBase.name}:`, error.message);
        // Store failed announcement for retry
        await this.storeFaiIedAnnouncement(targetBase, error);
      }
    }
  }

  async announceToBase(targetBase) {
    const announcement = {
      timestamp: new Date().toISOString(),
      baseInfo: {
        name: this.config.baseInfo.name,
        description: this.config.baseInfo.description,
        starSystemNumber: this.config.baseInfo.starSystemNumber,
        contactInfo: this.config.baseInfo.contactInfo
      },
      services: this.generateServiceUrls(),
      publicKey: this.keys.pubKey,
      signature: null // Will be added below
    };
    
    // Sign the announcement
    const message = JSON.stringify({
      timestamp: announcement.timestamp,
      baseInfo: announcement.baseInfo,
      services: announcement.services
    });
    
    announcement.signature = await this.sessionless.sign(message);
    
    // Send announcement to target base's BDO service
    const response = await axios.post(
      `${targetBase.services.bdo || targetBase.baseUrl}/announce`,
      announcement,
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Allyabase-Bootstrap/1.0'
        },
        timeout: 30000
      }
    );
    
    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.data;
  }

  generateServiceUrls() {
    const { basePort, portOffset } = this.config.services.ports;
    const enabled = this.config.services.enabled;
    
    // Service port mapping (relative to base port)
    const servicePortMap = {
      julia: 0,
      continuebee: -1,
      pref: 2,
      bdo: 3,
      joan: 4,
      addie: 5,
      fount: 6,
      dolores: 7,
      minnie: -475,  // Special case for minnie
      aretha: 5277,  // Special case for aretha
      sanora: 5243   // Special case for sanora
    };
    
    const services = {};
    const hostname = process.env.PUBLIC_HOSTNAME || 'localhost';
    
    for (const service of enabled) {
      if (servicePortMap.hasOwnProperty(service)) {
        const port = basePort + portOffset + servicePortMap[service];
        services[service] = `http://${hostname}:${port}`;
      }
    }
    
    return services;
  }

  async storeFaiIedAnnouncement(targetBase, error) {
    // Store failed announcements for retry (could use filesystem or database)
    const failedDir = path.join(__dirname, 'failed_announcements');
    await fs.ensureDir(failedDir);
    
    const failedAnnouncement = {
      targetBase,
      error: error.message,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };
    
    const filename = `failed_${Date.now()}_${targetBase.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    await fs.writeJson(path.join(failedDir, filename), failedAnnouncement, { spaces: 2 });
  }

  async retryFailedAnnouncements() {
    const failedDir = path.join(__dirname, 'failed_announcements');
    
    if (!await fs.pathExists(failedDir)) {
      return;
    }
    
    const failedFiles = await fs.readdir(failedDir);
    
    for (const filename of failedFiles) {
      try {
        const filePath = path.join(failedDir, filename);
        const failedAnnouncement = await fs.readJson(filePath);
        
        // Retry the announcement
        await this.announceToBase(failedAnnouncement.targetBase);
        
        // Remove the failed announcement file on success
        await fs.remove(filePath);
        logger.info(`✅ Retry successful for ${failedAnnouncement.targetBase.name}`);
        
      } catch (error) {
        logger.error(`❌ Retry failed for ${filename}:`, error.message);
        
        // Update retry count
        const filePath = path.join(failedDir, filename);
        const failedAnnouncement = await fs.readJson(filePath);
        failedAnnouncement.retryCount = (failedAnnouncement.retryCount || 0) + 1;
        failedAnnouncement.lastRetry = new Date().toISOString();
        
        // Remove after too many retries
        if (failedAnnouncement.retryCount >= 5) {
          await fs.remove(filePath);
          logger.warn(`🗑️ Removed failed announcement after 5 retries: ${filename}`);
        } else {
          await fs.writeJson(filePath, failedAnnouncement, { spaces: 2 });
        }
      }
    }
  }

  startServer() {
    const express = require('express');
    const app = express();
    
    app.use(express.json());
    
    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'allyabase-bootstrap',
        version: '1.0.0',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    });
    
    // Configuration endpoint (read-only)
    app.get('/config', (req, res) => {
      res.json(this.config);
    });
    
    // Status endpoint
    app.get('/status', (req, res) => {
      res.json({
        baseInfo: this.config.baseInfo,
        services: this.generateServiceUrls(),
        publicKey: this.keys.pubKey,
        announcementTargets: this.config.networking.announceToBase.length,
        activeJobs: Array.from(this.announcementJobs.keys())
      });
    });
    
    // Announcement endpoint (for receiving announcements from other bases)
    app.post('/announce', async (req, res) => {
      if (!this.config.networking.listenForAnnouncements) {
        return res.status(403).json({ error: 'Announcements not accepted' });
      }
      
      try {
        await this.handleIncomingAnnouncement(req.body);
        res.json({ status: 'accepted', timestamp: new Date().toISOString() });
      } catch (error) {
        logger.error('❌ Failed to handle incoming announcement:', error);
        res.status(400).json({ error: error.message });
      }
    });
    
    app.listen(PORT, () => {
      logger.info(`🌐 Bootstrap service HTTP server listening on port ${PORT}`);
    });
  }

  async handleIncomingAnnouncement(announcement) {
    // Verify signature
    const message = JSON.stringify({
      timestamp: announcement.timestamp,
      baseInfo: announcement.baseInfo,
      services: announcement.services
    });
    
    const isValid = await this.sessionless.verifySignature(
      announcement.signature,
      message,
      announcement.publicKey
    );
    
    if (!isValid) {
      throw new Error('Invalid signature');
    }
    
    // Store the announcement (could integrate with BDO or another storage service)
    const announcementsDir = path.join(__dirname, 'announcements');
    await fs.ensureDir(announcementsDir);
    
    const filename = `announcement_${Date.now()}_${announcement.baseInfo.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    await fs.writeJson(path.join(announcementsDir, filename), {
      ...announcement,
      receivedAt: new Date().toISOString()
    }, { spaces: 2 });
    
    logger.info(`📥 Received valid announcement from ${announcement.baseInfo.name}`);
  }

  minutesToCron(minutes) {
    // Convert minutes to cron pattern
    if (minutes >= 60 && minutes % 60 === 0) {
      // Every N hours
      const hours = minutes / 60;
      return `0 */${hours} * * *`;
    } else if (minutes >= 1440 && minutes % 1440 === 0) {
      // Every N days
      const days = minutes / 1440;
      return `0 0 */${days} * *`;
    } else {
      // Every N minutes
      return `*/${minutes} * * * *`;
    }
  }

  async shutdown() {
    logger.info('🛑 Shutting down bootstrap service...');
    
    // Stop all cron jobs
    for (const [name, job] of this.announcementJobs) {
      job.stop();
      logger.info(`✅ Stopped ${name} job`);
    }
    
    logger.info('👋 Bootstrap service shutdown complete');
    process.exit(0);
  }
}

// Main execution
if (require.main === module) {
  const bootstrap = new AllyabaseBootstrap();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => bootstrap.shutdown());
  process.on('SIGTERM', () => bootstrap.shutdown());
  
  // Start the service
  bootstrap.initialize().catch(error => {
    logger.error('❌ Bootstrap service failed to start:', error);
    process.exit(1);
  });
}

module.exports = AllyabaseBootstrap;