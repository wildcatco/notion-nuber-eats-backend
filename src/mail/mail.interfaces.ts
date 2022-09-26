export interface MailModuleOptions {
  isGlobal?: boolean;
  apiKey: string;
  domain: string;
  fromEmail: string;
}

export interface EmailVar {
  key: string;
  value: string;
}
