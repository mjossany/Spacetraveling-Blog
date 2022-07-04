import styles from './header.module.scss';

export default function Header(): JSX.Element {
  return (
    <div className={styles.header}>
      <img src="/images/logo.svg" alt="" />
    </div>
  );
}
