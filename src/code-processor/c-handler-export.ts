import ImportManager from './mtreehandler';

export default function(text: string | null): ImportManager {
  if (typeof text !== 'string') return new ImportManager(null);
  return new ImportManager(text);
}