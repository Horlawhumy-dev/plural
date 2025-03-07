defmodule Core.OAuth.Github do
  use OAuth2.Strategy
  use Core.OAuth.Base

  def client(redirect \\ nil, suffix \\ "") do
    OAuth2.Client.new([
      strategy: __MODULE__,
      client_id: get_env("GITHUB_CLIENT_ID"),
      client_secret: get_env("GITHUB_CLIENT_SECRET"),
      redirect_uri: "#{redirect || host()}/oauth/callback/github#{suffix}",
      site: "https://api.github.com",
      authorize_url: "https://github.com/login/oauth/authorize",
      token_url: "https://github.com/login/oauth/access_token"
    ])
    |> OAuth2.Client.put_serializer("application/json", Jason)
  end

  def authorize_url!(redirect) do
    OAuth2.Client.authorize_url!(client(redirect), scope: "user user:email user:name")
  end

  def get_token!(redirect, code) do
    OAuth2.Client.get_token!(client(redirect), code: code)
  end

  def get_user(client) do
    case OAuth2.Client.get(client, "/user") do
      {:ok, %OAuth2.Response{body: user}} ->
        construct_user(client, user)
      {:error, %OAuth2.Response{status_code: 401, body: body}} ->
        Logger.error("Unauthorized token, #{inspect(body)}")
        {:error, :unauthorized}
      {:error, %OAuth2.Error{reason: reason}} ->
        Logger.error("Error: #{inspect(reason)}")
        {:error, reason}
    end
  end

  defp construct_user(_, %{"email" => email} = user) when is_binary(email) do
    build_user(user)
    |> add_name(user)
    |> ok()
  end

  defp construct_user(client, user) do
    case OAuth2.Client.get(client, "/user/emails") do
      {:ok, %OAuth2.Response{body: [_ | _] = emails}} ->
        %{"email" => email} = Enum.find(emails, & &1["primary"])
        build_user(user)
        |> Map.put(:email, email)
        |> add_name(user)
        |> ok()
      _ -> {:error, :no_email}
    end
  end

  defp add_name(%{name: _} = user, %{"login" => login}), do: %{user | name: login}
  defp add_name(user, _), do: user
end
