import useLocalStorage from './useLocalStorage';

const useToggle = (key, initValue) => {
    const [value, setValue] = useLocalStorage(key, initValue);

    const toggle = (e) => {
        /*setValue(prev => {
            return typeof value === 'boolean' ? value : !prev;
        })*/
        setValue(prev => !prev);
    }

    return [value, toggle];
}

export default useToggle