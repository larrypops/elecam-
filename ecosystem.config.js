module.exports = {
  apps: [{
    name: 'elections-camer',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 9002
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
