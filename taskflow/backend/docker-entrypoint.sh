#!/bin/sh
# Se DATABASE_URL (postgresql://usuario:senha@host[:porta]/banco, formato entregue pelo Render)
# estiver definida, converte para as propriedades JDBC do Spring. Sem ela, valem as variáveis DB_*.
set -eu

urldecode() {
  s="$1"
  out=""
  while [ -n "$s" ]; do
    case "$s" in
      %[0-9A-Fa-f][0-9A-Fa-f]*)
        rest="${s#%}"
        hex="${rest%"${rest#??}"}"
        oct="$(printf '%03o' "0x$hex")"
        out="$out$(printf "\\$oct")"
        s="${s#???}"
        ;;
      *)
        out="$out${s%"${s#?}"}"
        s="${s#?}"
        ;;
    esac
  done
  printf '%s' "$out"
}

if [ -n "${DATABASE_URL:-}" ]; then
  case "$DATABASE_URL" in
    postgres://*|postgresql://*) ;;
    *) echo "DATABASE_URL inválida: esperado postgresql://usuario:senha@host[:porta]/banco" >&2; exit 1 ;;
  esac
  rest="${DATABASE_URL#*://}"
  userinfo="${rest%@*}"
  hostpart="${rest##*@}"
  user="${userinfo%%:*}"
  pass="${userinfo#*:}"
  hostport="${hostpart%%/*}"
  db="${hostpart#*/}"
  db="${db%%\?*}"
  host="${hostport%%:*}"
  port=5432
  case "$hostport" in *:*) port="${hostport##*:}" ;; esac

  SPRING_DATASOURCE_URL="jdbc:postgresql://$host:$port/$db"
  SPRING_DATASOURCE_USERNAME="$(urldecode "$user")"
  SPRING_DATASOURCE_PASSWORD="$(urldecode "$pass")"
  export SPRING_DATASOURCE_URL SPRING_DATASOURCE_USERNAME SPRING_DATASOURCE_PASSWORD
  unset DATABASE_URL
fi

# shellcheck disable=SC2086
exec java $JAVA_OPTS -jar /app/app.jar
