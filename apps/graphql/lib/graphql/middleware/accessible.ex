defmodule GraphQl.Middleware.Accessible do
  @behaviour Absinthe.Middleware
  import Absinthe.Resolution, only: [put_result: 2]
  alias Core.Services.Repositories
  alias Core.Schema.User

  def call(%{arguments: args, context: %{current_user: %User{} = user} = context} = res, _) do
    with {:ok, repo} <- get_repo(args),
         {:ok, _} <- Core.Policies.Repository.allow(repo, user, :access) do
      %{res | context: Map.put(context, :repo, repo)}
    else
      _ -> put_result(res, {:error, "forbidden"})
    end
  end

  defp get_repo(%{repository_id: repo_id}), do: {:ok, Repositories.get_repository!(repo_id)}
  defp get_repo(%{repository_name: name}), do: {:ok, Repositories.get_repository_by_name!(name)}
  defp get_repo(_), do: {:error, :invalid_argument}
end
