import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as yamlLoader from 'js-yaml';
import chalk from 'chalk';

export const config = {
  primaryColor: '#2ed573',
  errorColor: '#ff4757',
  secondaryColor: '#576574'
}

export const loadConfig = () => {
  const homedir = os.homedir();
  const configPath = '.strestConfig.yml';
  const p = path.join(homedir, configPath);

  if(fs.existsSync(p)) {
    if(fs.statSync(p).isFile()) {
      try {
        const parsed = yamlLoader.safeLoad(fs.readFileSync(p, 'utf8'));
        console.log(parsed);
        if(typeof parsed.config !== 'undefined' && parsed.config !== null) {
          if(typeof parsed.config.primaryColor !== 'undefined' && parsed.config.primaryColor !== null){
            config.primaryColor = parsed.config.primaryColor
          }
          if(typeof parsed.config.errorColor !== 'undefined' && parsed.config.errorColor !== null){
            config.errorColor = parsed.config.errorColor
          }
          if(typeof parsed.config.secondaryColor !== 'undefined' && parsed.config.secondaryColor !== null){
            config.secondaryColor = parsed.config.secondaryColor
          }
        }
      } catch(e) {
        console.log(chalk.red('Config bad formatted \n'))
      }
    }
  }

}