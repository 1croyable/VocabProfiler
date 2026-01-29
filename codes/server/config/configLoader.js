const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

function resolveEnvVariables(config) {
    if (typeof config === 'string') {
        if (config.startsWith('process.')) {
            const envKey = config.replace('process.', '');
            return process.env[envKey] || null;
        }
        return config;
    }

    if (typeof config === 'object' && config !== null) {
        for (const key in config) {
            if (config.hasOwnProperty(key)) {
                config[key] = resolveEnvVariables(config[key]);
            }
        }
    }

    return config;
}

function loadYamlConfig(configPath) {
    let yamlConfig = {};
    try {
        const fileContent = fs.readFileSync(path.resolve(configPath), 'utf8');
        yamlConfig = yaml.load(fileContent);
    } catch (e) {
        console.error('加载 YAML 文件失败:', e.message);
        process.exit(1);
    }

    return resolveEnvVariables(yamlConfig);
}

function getConfig(key) {
    const config = loadYamlConfig(path.join(__dirname, './config.yaml'));
    const keys = key.split('.');
    let result = config;

    for (const k of keys) {
        result = result?.[k];
        if (result === undefined) {
            throw new Error(`配置项 "${key}" 未找到`);
        }
    }

    return result;
}

module.exports = { getConfig };